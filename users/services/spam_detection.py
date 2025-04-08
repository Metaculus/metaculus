import asyncio
import logging
import textwrap
import time
from datetime import timedelta
from typing import cast

from django.conf import settings
from django.utils import timezone

from comments.models import Comment
from misc.tasks import send_email_async
from posts.models import Post
from users.models import User, UserSpamActivity
from users.serializers import UserUpdateProfileSerializer
from utils.email import send_email_with_template
from utils.openai import generate_text_async, run_spam_analysis

logger = logging.getLogger(__name__)
CONFIDENCE_THRESHOLD = 0.9


def should_check_for_user_spam(user: User) -> bool:
    comments_count = Comment.objects.filter(author=user).count()
    posts_count = Post.objects.filter(author=user).count()

    # Check for spam if the user has posted less than X posts or comments
    return comments_count + posts_count <= 20


def check_and_handle_content_spam(
    author: User,
    content_text: str,
    content_id: int,
    content_type: str,
    content_admin_url: str,
    content_frontend_url: str,
    admin_emails: list[str],
    email_content_quote: str | None = None,
) -> bool:
    if (
        not settings.CHECK_FOR_SPAM_IN_COMMENTS_AND_POSTS
        or not should_check_for_user_spam(author)
    ):
        return False

    result = run_spam_analysis(content_text, content_type)

    # TODO: Remove this once we gain some confidence it the level of false positives is acceptable
    logging.info(f"Spam analysis result {result} from content {content_text}")

    if not result.is_spam:
        return False

    UserSpamActivity.objects.create(
        user=author,
        reason=result.reason,
        confidence=result.confidence,
        content_type=content_type,
        content_id=content_id,
        text=content_text,
    )

    # High confidence spam
    if result.confidence > CONFIDENCE_THRESHOLD:
        # Deactivate user if they have 10 or more spam entries
        total_spam_count = UserSpamActivity.objects.filter(
            user=author, confidence__gte=CONFIDENCE_THRESHOLD
        ).count()
        if total_spam_count > 10:
            author.is_active = False
            author.is_spam = True
            author.save(update_fields=["is_active", "is_spam"])
            send_deactivation_email(author.email)

        # Send an email to admins if the user has 2 or more spam entries within 2 weeks
        spam_count = UserSpamActivity.objects.filter(
            user=author,
            created_at__gte=timezone.now() - timedelta(days=14),
        ).count()
        if spam_count >= 2:
            send_repeated_spam_to_admins_email(
                admin_emails,
                author=author,
                content_type=content_type,
                content_url=content_admin_url,
                content_text=email_content_quote or content_text,
            )
        return True

    # Low confidence spam
    send_suspected_spam_to_admins_email(
        admin_emails,
        author=author,
        content_type=content_type,
        content_url=content_frontend_url,
        content_text=email_content_quote or content_text,
    )

    return False


def check_profile_data_for_spam(user: User, **args):
    bio: str | None = args.get("bio")
    website: str | None = args.get("website")
    if bio and website:
        bio_plus_website = f"{bio}\n\nWebsite: {website}"
    elif not bio and website:
        bio_plus_website = f"Website: {website}\n[NOTE: User has an empty bio]"
    elif bio and not website:
        bio_plus_website = bio
    else:
        bio_plus_website = ""

    start_time = time.time()
    identified_as_spam = False
    reasoning = ""
    gpt_was_used = False
    if not bio_plus_website:
        identified_as_spam = False
        reasoning = "No bio to check for spam"
    elif len(bio_plus_website) < 10:
        identified_as_spam = False
        reasoning = "Bio is too short to be spam"
    elif len(bio_plus_website) > 17500:
        identified_as_spam = True
        reasoning = "Bio is more than 17500 characters"
    else:
        identified_as_spam, reasoning = asyncio.run(
            ask_gpt_to_check_profile_for_spam(bio_plus_website)
        )
        gpt_was_used = True
    end_time = time.time()
    duration = end_time - start_time

    if identified_as_spam:
        logger.info(
            f"User: {user.username} ID: {user.id} was detected as spam "
            f"for spam bio: {bio_plus_website[:100]}... "
            f"The reason was: {reasoning[:100]}... "
            f"It took {duration:.2f} seconds to check. "
            f"gpt_was_used: {gpt_was_used}"
        )
    return identified_as_spam, reasoning


def check_profile_update_for_spam(
    user: User, valid_serializer: UserUpdateProfileSerializer
) -> tuple[bool, str]:
    days_since_joined = (timezone.now() - user.date_joined).days
    days_since_joined_threshold = 7
    request_data = cast(dict, valid_serializer.validated_data)

    if days_since_joined > days_since_joined_threshold:
        identified_as_spam = False
        reasoning = (
            "The user has been a member for more than "
            f"{days_since_joined_threshold} days"
        )
    else:
        identified_as_spam, reasoning = check_profile_data_for_spam(
            user, **request_data
        )

    return identified_as_spam, reasoning


async def ask_gpt_to_check_profile_for_spam(bio_plus_websites: str) -> tuple[bool, str]:
    if not settings.OPENAI_API_KEY:
        return False, "No API key set, so not checking for spam"

    system_prompt = textwrap.dedent(
        """
        You are a content moderator for Metaculus.
        Metaculus is a site that hosts tournaments where people compete to predict the future outcome of events.
        Government officials, businesses, nonprofits, and others uses these predictions to make better decisions.

        Your job is to identify if a user is normal, or is a spammer/bot given their bio.
        - Watch out for any text trying to sell something
        - Anything a random good intentioned user or staff member would not write.
        - If they don't give a link, then don't mark them as spam (unless they are really clearly trying to sell something with a lot of spam like language)

        In the end you will respond with TRUE or FALSE. Give your reasoning then say TRUE (if it is spam) or FALSE (if it is not spam).
        Do not say TRUE or FALSE except as your last line.
        """
    )
    prompt = textwrap.dedent(
        f"""
        Is the following user a spammer or bot?

        Here is the bio:
        {bio_plus_websites}

        Lets take this step by step. Give your reasoning then say TRUE (if it is spam) or FALSE (if it is not spam).
        """
    )
    try:
        gpt_response = await generate_text_async(
            model="gpt-4o-mini",
            system_prompt=system_prompt,
            prompt=prompt,
            temperature=0,
            timeout=7,
        )
        is_spam = "TRUE" in gpt_response
    except Exception as e:
        logger.info(
            f"AI call failed while checking for spam defaulting to FALSE. Error: {e}"
        )
        is_spam = False
        gpt_response = "AI call failed"
    return is_spam, gpt_response


def send_deactivation_email(user_email: str) -> None:
    send_email_async.send(
        subject="Metaculus Account Deactivation - Please note our links don't help SEO",
        message=textwrap.dedent(
            """Your Metaculus account has been deactivated by an automated system. Possible reasons could include
            - Suspicious activity
            - Spam/Ad/Inappropriate content in comments
            - Spam/Ad/Inappropriate content in profile bio

            Just for reference, we set our links so that Google doesn't pick them up for SEO. Adding spam to the site does nothing to help your rankings.

            If you believe you were marked as spam in error, please contact support@metaculus.com"""
        ),
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[user_email],
    )


def send_suspected_spam_to_admins_email(
    to_emails: list[str],
    author: User,
    content_type: str,
    content_url: str,
    content_text: str,
) -> None:
    send_email_with_template(
        to_emails,
        f"Suspected spam {content_type} from user {author.username}",
        "emails/suspected_spam_to_admins.html",
        context={
            "author": author,
            "content_type": content_type,
            "content_url": content_url,
            "content_text": content_text,
        },
        from_email=settings.EMAIL_NOTIFICATIONS_USER,
    )


def send_repeated_spam_to_admins_email(
    to_emails: list[str],
    author: User,
    content_type: str,
    content_url: str,
    content_text: str,
) -> None:
    send_email_with_template(
        to_emails,
        f"Repeated spam {content_type} from user {author.username}",
        "emails/repeated_spam_to_admins.html",
        context={
            "author": author,
            "content_type": content_type,
            "content_url": content_url,
            "content_text": content_text,
        },
        from_email=settings.EMAIL_NOTIFICATIONS_USER,
    )

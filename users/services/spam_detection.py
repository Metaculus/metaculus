import asyncio
import textwrap
from typing import cast
import logging

from django.conf import settings
from django.utils import timezone

from users.serializers import UserUpdateProfileSerializer
from users.models import User
from utils.openai import generate_text_async
from misc.tasks import send_email_async

logger = logging.getLogger(__name__)

def check_profile_update_for_spam(user: User, valid_serializer: UserUpdateProfileSerializer) -> tuple[bool, str]:
    days_since_joined = (timezone.now() - user.date_joined).days
    days_since_joined_threshold = 7
    request_data = cast(dict, valid_serializer.validated_data)

    bio: str | None = request_data.get("bio")
    website: str | None = request_data.get("website")
    website = f"\n\nWebsite: {website}" if website else ""
    bio_plus_websites = (bio + website) if bio else ""

    idenficated_as_spam = False
    reasoning = ""
    if not bio_plus_websites:
        idenficated_as_spam = False
        reasoning = "No bio to check for spam"
    elif len(bio_plus_websites) < 10:
        idenficated_as_spam = False
        reasoning = "Bio is too short to be spam"
    elif days_since_joined > days_since_joined_threshold:
        idenficated_as_spam = False
        reasoning = f"The user has been a member for more than {days_since_joined_threshold} days"
    elif len(bio_plus_websites) > 25000:
        idenficated_as_spam = True
        reasoning = "Bio is more than 25000 characters"
    else:
        idenficated_as_spam, reasoning = asyncio.run(ask_gpt_to_check_profile_for_spam(bio_plus_websites, user.email))

    if idenficated_as_spam:
        logger.warning(
            f"User {user.username} was soft deleted for spam bio: {bio_plus_websites}\n"
            f"Reasoning: {reasoning}"
        )
    return idenficated_as_spam, reasoning


async def ask_gpt_to_check_profile_for_spam(
    bio_plus_websites: str, email: str
) -> tuple[bool, str]:
    if not settings.OPENAI_API_KEY:
        return False, "No API key set, so not checking for spam"

    system_prompt = textwrap.dedent(
        """
        You are a content moderator for Metaculus.
        Metaculus is a site that hosts tournaments where people compete to predict the future outcome of events.
        Government officials, businesses, nonprofits, and others uses these predictions to make better decisions.

        Your job is to identify if a user is normal, or is a spammer/bot given their bio and username.
        - Watch out for any text trying to sell something combined with weird emails
        - Anything a random good intentioned user or staff member would not write.
        - If they don't give a link, then don't mark them as spam (unless they are really clearly trying to sell something with a lot of spam like language)

        You will be given a bio and a username.
        The bio will be in the <[#bio]> tags.
        Say SPAM if you see more than one opening and closing tag for <[#bio]>.

        In the end you will respond with TRUE or FALSE. Give your reasoning then say TRUE (if it is spam) or FALSE (if it is not spam).
        Do not say TRUE or FALSE except as your last line.
        """
    )
    prompt = textwrap.dedent(
        f"""
        Is the following user a spammer or bot?

        Their email is {email}.

        Here is the bio:
        <[#bio]>
        {bio_plus_websites}
        </[#bio]>

        Lets take this step by step. Give your reasoning then say TRUE (if it is spam) or FALSE (if it is not spam).
        """
    )
    try:
        gpt_response = await generate_text_async(
            model="gpt-4o-mini",
            system_prompt=system_prompt,
            prompt=prompt,
            temperature=0,
        )
        is_spam = "TRUE" in gpt_response
    except Exception as e:
        logger.info(f"AI call failed while checking for spam defaulting to FALSE. Error: {e}")
        is_spam = False
        gpt_response = "AI call failed"
    return is_spam, gpt_response

def send_deactivation_email(user_email: str) -> None:
    send_email_async.send(
        subject="Your Metaculus Account Has Been Deactivated",
        message=textwrap.dedent(
            """Your Metaculus account has been deactivated by an administrator or an automated system. Possible reasons could include
            - Suspicious activity
            - Spam/Ad/Inappropriate content in comments
            - Spam/Ad/Inappropriate content in profile bio
            - Manual review for bot and spam accounts

            If you believe this was done in error, please contact support@metaculus.com"""
        ),
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[user_email],
    )

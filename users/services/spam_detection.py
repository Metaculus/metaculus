import asyncio
import textwrap

from django.conf import settings
from django.utils import timezone

from users.models import User
from utils.openai import generate_text_async
import logging

logger = logging.getLogger(__name__)

def check_for_spam(user: User, request_data: dict) -> tuple[bool, str]:  # NOSONAR
    days_since_joined = (timezone.now() - user.date_joined).days
    days_since_joined_threshold = 7

    bio: str | None = request_data.get("bio")
    website: str | None = request_data.get("website")
    bio_plus_websites = (bio if bio else "") + (f"\n\nWebsite: {website}" if website else "")

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
        idenficated_as_spam, reasoning = asyncio.run(_ask_gpt_to_check_for_spam(bio_plus_websites, user.email))

    if idenficated_as_spam:
        logger.warning(
            f"User {user.username} was soft deleted for spam bio: {bio_plus_websites}\n"
            f"Reasoning: {reasoning}"
        )
    return idenficated_as_spam, reasoning


async def _ask_gpt_to_check_for_spam(
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
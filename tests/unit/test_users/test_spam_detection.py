from users.models import UserSpamActivity
from users.services.spam_detection import check_and_handle_content_spam
from tests.unit.test_users.factories import factory_user


def test_check_and_handle_content_spam_defaults_to_not_spam_when_openai_fails(
    mocker, settings
):
    settings.CHECK_FOR_SPAM_IN_COMMENTS_AND_POSTS = True
    user = factory_user(check_for_spam=True)
    mocker.patch(
        "users.services.spam_detection.should_check_for_user_spam"
    ).return_value = True
    mocker.patch(
        "users.services.spam_detection.run_spam_analysis",
        side_effect=RuntimeError("OpenAI quota exhausted"),
    )

    is_spam = check_and_handle_content_spam(
        author=user,
        content_text="Sample comment",
        content_id=123,
        content_type=UserSpamActivity.SpamContentType.COMMENT,
        content_admin_url="/admin/comments/comment/123/change/",
        content_frontend_url="/questions/1/#comment-123",
        admin_emails=[],
    )

    assert is_spam is False
    assert UserSpamActivity.objects.count() == 0

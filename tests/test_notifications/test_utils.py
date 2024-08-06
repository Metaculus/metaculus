import pytest

from notifications.utils import generate_email_comment_preview_text


@pytest.mark.parametrize(
    "message,username,expected_preview,expected_found_mention",
    [
        [
            "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration "
            "in some form, by injected humour, or randomised words which don't look even slightly believable.",
            None,
            "There are many variations of passages of Lorem Ipsum available, but the majority...",
            False,
        ],
        [
            (
                "There are many variations of passages @username of Lorem Ipsum available, but the majority "
                "have suffered alteration in some form, by injected humour, "
                "or randomised words which don't look even slightly believable."
            ),
            "username",
            (
                "There are many variations of passages <b>@username</b> of Lorem Ipsum available, but the major..."
            ),
            True,
        ],
        [
            (
                "There are many variations of passages of Lorem Ipsum available, but the majority "
                "have suffered alteration in some form, @username by injected humour, "
                "or randomised words which don't look even slightly believable."
            ),
            "username",
            (
                "... have suffered alteration in some form, <b>@username</b> "
                "by injected humour, or randomised words..."
            ),
            True,
        ],
        [
            (
                "There are many variations of passages @(username) of Lorem Ipsum available, but the majority "
                "have suffered alteration in some form, by injected humour, "
                "or randomised words which don't look even slightly believable."
            ),
            "username",
            (
                "There are many variations of passages <b>@username</b> of Lorem Ipsum available, but the major..."
            ),
            True,
        ],
        # Mention of other users
        [
            (
                "There are many variations of passages @(username2) of Lorem Ipsum available, but the majority "
                "have suffered alteration in some form, by injected humour, "
                "or randomised words which don't look even slightly believable."
            ),
            "username",
            (
                "There are many variations of passages @username2 of Lorem Ipsum available, but t..."
            ),
            False,
        ],
    ],
)
def test_generate_email_comment_preview_text(
    message, username, expected_preview, expected_found_mention
):
    preview, found_mention = generate_email_comment_preview_text(message, username)

    assert preview == expected_preview
    assert found_mention == expected_found_mention

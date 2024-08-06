import re

import pytest

from comments.utils import USERNAME_PATTERN


@pytest.mark.parametrize(
    "mention,actual_username", [["@username", "username"], ["@(username)", "username"]]
)
def test_username_pattern(mention, actual_username):
    assert re.findall(USERNAME_PATTERN, mention)[0] == actual_username

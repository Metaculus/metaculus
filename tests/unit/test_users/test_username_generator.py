import re

from users.constants import forbidden_usernames
from users.models import User
from users.services.username_generator import (
    ADJECTIVES,
    NOUNS,
    generate_username,
)


class TestGenerateUsername:
    def test_format_is_valid_username(self):
        for _ in range(50):
            username = generate_username()
            assert re.fullmatch(r"^\w([\w.@+-]*\w)?$", username)

    def test_collision_falls_back_to_smallest_free_suffix(self, mocker):
        # Pin the generator to one combination, occupy it and the first numeric
        # suffixes, and confirm it skips the taken ones for the smallest free.
        mocker.patch("random.choice", side_effect=lambda seq: seq[0])
        combo = f"{ADJECTIVES[0]}{NOUNS[0]}"
        for i, name in enumerate([combo, f"{combo}2", f"{combo}3"]):
            User.objects.create_user(username=name, email=f"taken{i}@example.com")

        assert generate_username() == f"{combo}4"

    def test_unicode_digit_suffix_does_not_crash(self, mocker):
        # A stored suffix like "²" passes isdigit() but int() rejects it; the
        # fallback must skip such names, not raise ValueError. Written straight
        # to the DB because create_user NFKC-normalizes "²" to "2".
        mocker.patch("random.choice", side_effect=lambda seq: seq[0])
        combo = f"{ADJECTIVES[0]}{NOUNS[0]}"
        User.objects.create_user(username=combo, email="c0@example.com")
        planted = User.objects.create_user(username=f"{combo}_x", email="c1@e.com")
        User.objects.filter(pk=planted.pk).update(username=f"{combo}²")

        assert generate_username() == f"{combo}2"

    def test_wordlists_not_forbidden(self):
        # Load-bearing: this invariant replaces any runtime forbidden-name
        # check in the generator.
        for adj in ADJECTIVES:
            for noun in NOUNS:
                assert f"{adj}{noun}".lower() not in forbidden_usernames

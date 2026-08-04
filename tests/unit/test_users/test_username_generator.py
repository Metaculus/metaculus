import re

import pytest

from users.models import User
from users.services.username_generator import (
    MAX_GENERATED_LENGTH,
    PATTERNS,
    generate_username,
)


@pytest.fixture
def pin_generator(mocker):
    """
    Pins every random draw to its first option and returns the single name the
    generator can then produce: the first word of each part of the pattern.
    """

    def pin(pattern_index: int = 0) -> str:
        mocker.patch(
            "random.choices",
            side_effect=lambda population, weights=None, k=1: (
                [population[pattern_index]] * k
            ),
        )
        mocker.patch("random.choice", side_effect=lambda seq: seq[0])

        return "".join(part[0] for part in PATTERNS[pattern_index])

    return pin


class TestGenerateUsername:
    def test_format_is_valid_username(self):
        for _ in range(20):
            username = generate_username()

            assert re.fullmatch(r"^\w([\w.@+-]*\w)?$", username)
            assert len(username) <= MAX_GENERATED_LENGTH

    def test_each_pattern_composes_from_its_own_parts(self, pin_generator):
        for index in range(len(PATTERNS)):
            expected = pin_generator(index)

            assert generate_username() == expected

    def test_collision_falls_back_to_smallest_free_suffix(self, pin_generator):
        # Pin the generator to one name, occupy it and the first numeric
        # suffixes, and confirm it skips the taken ones for the smallest free.
        combo = pin_generator()
        for i, name in enumerate([combo, f"{combo}2", f"{combo}3"]):
            User.objects.create_user(username=name, email=f"taken{i}@example.com")

        assert generate_username() == f"{combo}4"

    def test_unicode_digit_suffix_does_not_crash(self, pin_generator):
        # A stored suffix like "²" passes isdigit() but int() rejects it; the
        # fallback must skip such names, not raise ValueError. Written straight
        # to the DB because create_user NFKC-normalizes "²" to "2".
        combo = pin_generator()
        User.objects.create_user(username=combo, email="c0@example.com")
        planted = User.objects.create_user(username=f"{combo}_x", email="c1@e.com")
        User.objects.filter(pk=planted.pk).update(username=f"{combo}²")

        assert generate_username() == f"{combo}2"

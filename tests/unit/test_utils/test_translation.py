import asyncio
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from utils.translation import (
    agoogle_translate_text,
    rejoin_translated,
    split_for_translation,
)

# The Spanish original of question 35557, which regressed: translating it as HTML
# dropped the "[" and "](url)" around the <u> tag, leaving unclickable text.
GEORGESCU_ES = (
    "En noviembre de 2024, Călin Georgescu, un [<u>candidato ultranacionalista con"
    " sentimientos pro-rusos</u>](https://ro.wikipedia.org/wiki/C%C4%83lin_Georgescu),"
    " ganó la primera vuelta."
)


def roundtrip(text, translate=lambda line: line):
    translatable, layout = split_for_translation(text)
    return rejoin_translated(layout, [translate(line) for line in translatable])


class TestSplitForTranslation:
    def test_only_non_blank_lines_are_sent(self):
        translatable, _ = split_for_translation("uno\n\n\ndos")
        assert translatable == ["uno", "dos"]

    def test_blank_lines_are_preserved(self):
        assert roundtrip("uno\n\n\ndos") == "uno\n\n\ndos"

    def test_leading_and_trailing_newlines_are_preserved(self):
        assert roundtrip("\n\nuno\n\n") == "\n\nuno\n\n"

    def test_carriage_returns_are_preserved(self):
        assert roundtrip("uno\r\n\r\ndos") == "uno\r\n\r\ndos"

    def test_single_line(self):
        assert roundtrip("uno") == "uno"

    def test_empty_text_has_nothing_to_translate(self):
        translatable, layout = split_for_translation("")
        assert translatable == []
        assert rejoin_translated(layout, []) == ""

    def test_whitespace_only_text_is_untouched(self):
        translatable, _ = split_for_translation("\n \n")
        assert translatable == []
        assert roundtrip("\n \n") == "\n \n"

    def test_markdown_structure_survives_a_translation(self):
        text = "# Título\n\nUn [enlace](https://example.com) aquí.\n\n* uno\n* dos"
        assert roundtrip(text, translate=str.upper) == (
            "# TÍTULO\n\nUN [ENLACE](HTTPS://EXAMPLE.COM) AQUÍ.\n\n* UNO\n* DOS"
        )

    def test_link_with_inline_html_label_is_left_intact(self):
        # The regression from #2299: the link must reach the API in one piece.
        translatable, _ = split_for_translation(GEORGESCU_ES)
        assert translatable == [GEORGESCU_ES]
        assert roundtrip(GEORGESCU_ES) == GEORGESCU_ES


class TestRejoinTranslated:
    def test_rejects_a_short_response(self):
        _, layout = split_for_translation("uno\ndos")
        with pytest.raises(ValueError):
            rejoin_translated(layout, ["one"])


def mock_translate_session(translations):
    response = MagicMock()
    response.status = 200
    response.json = AsyncMock(
        return_value={"translations": [{"translatedText": t} for t in translations]}
    )

    post_calls = []

    @asynccontextmanager
    async def post(url, headers, json):
        post_calls.append({"url": url, "headers": headers, "json": json})
        yield response

    session = MagicMock()
    session.post = post

    @asynccontextmanager
    async def client_session():
        yield session

    return client_session, post_calls


class TestAgoogleTranslateText:
    def _translate(self, text, translations):
        client_session, post_calls = mock_translate_session(translations)

        with (
            patch(
                "utils.translation.get_and_cache_sa_info",
                return_value=("token", "project"),
            ),
            patch("aiohttp.ClientSession", client_session),
        ):
            result = asyncio.run(agoogle_translate_text("es", "en", text))

        return result, post_calls

    def test_sends_plain_text_mimetype_in_the_payload(self):
        _, post_calls = self._translate("hola", ["hello"])

        payload = post_calls[0]["json"]
        assert payload["mimeType"] == "text/plain"
        # mimeType in the headers is what caused #2299 - it was silently ignored.
        assert "mimeType" not in post_calls[0]["headers"]

    def test_sends_contents_as_a_list_of_lines(self):
        _, post_calls = self._translate("hola\n\nadiós", ["hello", "goodbye"])

        assert post_calls[0]["json"]["contents"] == ["hola", "adiós"]

    def test_reassembles_the_translated_lines(self):
        result, _ = self._translate("hola\n\nadiós", ["hello", "goodbye"])

        assert result == "hello\n\ngoodbye"

    def test_unescapes_html_entities_in_the_response(self):
        result, _ = self._translate("Tom y Jerry", ["Tom &amp; Jerry"])

        assert result == "Tom & Jerry"

    def test_same_language_skips_the_api(self):
        client_session, post_calls = mock_translate_session([])

        with (
            patch(
                "utils.translation.get_and_cache_sa_info",
                return_value=("token", "project"),
            ),
            patch("aiohttp.ClientSession", client_session),
        ):
            result = asyncio.run(agoogle_translate_text("en", "en", "unchanged"))

        assert result == "unchanged"
        assert post_calls == []

    def test_text_without_anything_translatable_skips_the_api(self):
        client_session, post_calls = mock_translate_session([])

        with (
            patch(
                "utils.translation.get_and_cache_sa_info",
                return_value=("token", "project"),
            ),
            patch("aiohttp.ClientSession", client_session),
        ):
            result = asyncio.run(agoogle_translate_text("es", "en", "\n\n"))

        assert result == "\n\n"
        assert post_calls == []

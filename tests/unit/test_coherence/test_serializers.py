from django.db import connection
from django.test.utils import CaptureQueriesContext

from coherence.serializers import serialize_aggregate_coherence_links_questions_map
from tests.unit.test_questions.conftest import *  # noqa


def test_questions_map_without_links_skips_link_table(question_binary):
    with CaptureQueriesContext(connection) as ctx:
        assert (
            serialize_aggregate_coherence_links_questions_map([question_binary]) == {}
        )

    assert not [
        q for q in ctx.captured_queries if '"coherence_coherencelink"' in q["sql"]
    ]

from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework.reverse import reverse

from scoring.constants import LeaderboardScoreTypes
from scoring.models import Leaderboard, LeaderboardEntry
from tests.unit.test_projects.factories import factory_project


def test_leaderboard_entries_skip_private_user_columns(anon_client, user1):
    project = factory_project()
    project.primary_leaderboard = Leaderboard.objects.create(
        project=project, score_type=LeaderboardScoreTypes.PEER_TOURNAMENT
    )
    project.save()
    LeaderboardEntry.objects.create(
        leaderboard=project.primary_leaderboard, user=user1, score=1, medal="gold"
    )

    with CaptureQueriesContext(connection) as ctx:
        leaderboards = anon_client.get(
            reverse("project-leaderboard", kwargs={"project_id": project.id})
        ).data
        medals = anon_client.get(reverse("user-medals"), {"userId": user1.id}).data

    assert leaderboards[0]["entries"][0]["user"]["username"] == "user1"
    assert medals[0]["user"]["username"] == "user1"
    assert not [
        q for q in ctx.captured_queries if '"users_user"."password"' in q["sql"]
    ]

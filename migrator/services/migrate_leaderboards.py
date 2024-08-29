from datetime import timedelta

from collections import defaultdict
from django.utils import timezone


from posts.models import Post
from projects.models import Project
from scoring.models import (
    LeaderboardEntry,
    Leaderboard,
    global_leaderboard_dates_and_score_types,
)
from scoring.utils import update_project_leaderboard


def create_global_leaderboards():
    # make sure Main Site project has all public posts
    project = Project.objects.get(type=Project.ProjectTypes.SITE_MAIN)
    project.posts.set(Post.objects.filter_public())

    leaderboard_details = global_leaderboard_dates_and_score_types()
    main_site_project = Project.objects.filter(
        type=Project.ProjectTypes.SITE_MAIN
    ).first()
    for start, end, score_type in leaderboard_details:
        leaderboard: Leaderboard = Leaderboard.objects.get_or_create(
            project=main_site_project,
            start_time=start,
            end_time=end,
            score_type=score_type,
        )[0]
        if leaderboard.score_type in [
            Leaderboard.ScoreTypes.PEER_GLOBAL,
            Leaderboard.ScoreTypes.PEER_GLOBAL_LEGACY,
            Leaderboard.ScoreTypes.BASELINE_GLOBAL,
        ]:
            leaderboard.finalize_time = leaderboard.end_time + timedelta(days=100)
        else:
            leaderboard.finalize_time = leaderboard.end_time
        leaderboard.name = f"{start.year}: {end.year - start.year} year {score_type}"
        leaderboard.save()


def populate_global_leaderboards():
    main_site_project = Project.objects.filter(
        type=Project.ProjectTypes.SITE_MAIN
    ).first()
    global_leaderboards = main_site_project.leaderboards.all()

    c = len(global_leaderboards)
    for i, leaderboard in enumerate(global_leaderboards, 1):
        print("populating:", i, "/", c, leaderboard.name, end="\r")
        update_project_leaderboard(main_site_project, leaderboard)
        entries = LeaderboardEntry.objects.filter(leaderboard=leaderboard).count()
        print(
            "\033[Kpopulating:",
            i,
            "/",
            c,
            leaderboard.name,
            "(created",
            entries,
            "entries)",
            end="\r" if entries == 0 else "\n",
        )


def populate_project_leaderboards():
    projects_with_leaderboads = Project.objects.filter(
        type__in=[Project.ProjectTypes.TOURNAMENT, Project.ProjectTypes.QUESTION_SERIES]
    )
    c = len(projects_with_leaderboads)
    for i, project in enumerate(projects_with_leaderboads, 1):
        print("populating:", i, "/", c, project.name, end="\r")
        for leaderboard in project.leaderboards.all():
            update_project_leaderboard(project, leaderboard)
        entries = LeaderboardEntry.objects.filter(leaderboard__project=project).count()
        print(
            "\033[Kpopulating:",
            i,
            "/",
            c,
            project.name,
            "(created",
            entries,
            "entries)",
            end="\r" if entries == 0 else "\n",
        )

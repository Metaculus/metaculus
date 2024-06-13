from datetime import datetime, timedelta, timezone

from posts.models import Post
from projects.models import Project
from scoring.models import LeaderboardEntry
from scoring.utils import create_leaderboard_entries


def create_global_leaderboards():
    # Public leaderboard details
    leaderboard_details = [
        # one year peer
        [2016, 1, Project.LeaderboardTypes.PEER],
        [2017, 1, Project.LeaderboardTypes.PEER],
        [2018, 1, Project.LeaderboardTypes.PEER],
        [2019, 1, Project.LeaderboardTypes.PEER],
        [2020, 1, Project.LeaderboardTypes.PEER],
        [2021, 1, Project.LeaderboardTypes.PEER],
        [2022, 1, Project.LeaderboardTypes.PEER],
        [2023, 1, Project.LeaderboardTypes.PEER],
        [2024, 1, Project.LeaderboardTypes.PEER],
        [2025, 1, Project.LeaderboardTypes.PEER],
        # one year baseline
        [2016, 1, Project.LeaderboardTypes.BASELINE],
        [2017, 1, Project.LeaderboardTypes.BASELINE],
        [2018, 1, Project.LeaderboardTypes.BASELINE],
        [2019, 1, Project.LeaderboardTypes.BASELINE],
        [2020, 1, Project.LeaderboardTypes.BASELINE],
        [2021, 1, Project.LeaderboardTypes.BASELINE],
        [2022, 1, Project.LeaderboardTypes.BASELINE],
        [2023, 1, Project.LeaderboardTypes.BASELINE],
        [2024, 1, Project.LeaderboardTypes.BASELINE],
        [2025, 1, Project.LeaderboardTypes.BASELINE],
        # # one year COMMENT_INSIGHT
        # [2016, 1, Project.LeaderboardTypes.COMMENT_INSIGHT],
        # [2017, 1, Project.LeaderboardTypes.COMMENT_INSIGHT],
        # [2018, 1, Project.LeaderboardTypes.COMMENT_INSIGHT],
        # [2019, 1, Project.LeaderboardTypes.COMMENT_INSIGHT],
        # [2020, 1, Project.LeaderboardTypes.COMMENT_INSIGHT],
        # [2021, 1, Project.LeaderboardTypes.COMMENT_INSIGHT],
        # [2022, 1, Project.LeaderboardTypes.COMMENT_INSIGHT],
        # [2023, 1, Project.LeaderboardTypes.COMMENT_INSIGHT],
        # [2024, 1, Project.LeaderboardTypes.COMMENT_INSIGHT],
        # [2025, 1, Project.LeaderboardTypes.COMMENT_INSIGHT],
        # # one year QUESTION_WRITING
        # [2016, 1, Project.LeaderboardTypes.QUESTION_WRITING],
        # [2017, 1, Project.LeaderboardTypes.QUESTION_WRITING],
        # [2018, 1, Project.LeaderboardTypes.QUESTION_WRITING],
        # [2019, 1, Project.LeaderboardTypes.QUESTION_WRITING],
        # [2020, 1, Project.LeaderboardTypes.QUESTION_WRITING],
        # [2021, 1, Project.LeaderboardTypes.QUESTION_WRITING],
        # [2022, 1, Project.LeaderboardTypes.QUESTION_WRITING],
        # [2023, 1, Project.LeaderboardTypes.QUESTION_WRITING],
        # [2024, 1, Project.LeaderboardTypes.QUESTION_WRITING],
        # [2025, 1, Project.LeaderboardTypes.QUESTION_WRITING],
        # two year peer
        [2016, 2, Project.LeaderboardTypes.PEER],
        [2018, 2, Project.LeaderboardTypes.PEER],
        [2020, 2, Project.LeaderboardTypes.PEER],
        [2022, 2, Project.LeaderboardTypes.PEER],
        [2024, 2, Project.LeaderboardTypes.PEER],
        # two year baseline
        [2016, 2, Project.LeaderboardTypes.BASELINE],
        [2018, 2, Project.LeaderboardTypes.BASELINE],
        [2020, 2, Project.LeaderboardTypes.BASELINE],
        [2022, 2, Project.LeaderboardTypes.BASELINE],
        [2024, 2, Project.LeaderboardTypes.BASELINE],
        # five year peer
        [2016, 5, Project.LeaderboardTypes.PEER],
        [2021, 5, Project.LeaderboardTypes.PEER],
        # five year baseline
        [2016, 5, Project.LeaderboardTypes.BASELINE],
        [2021, 5, Project.LeaderboardTypes.BASELINE],
        # ten year peer
        [2016, 10, Project.LeaderboardTypes.PEER],
        # ten year baseline
        [2016, 10, Project.LeaderboardTypes.BASELINE],
    ]
    i = 0
    c = len(leaderboard_details)
    for start_year, duration, category in leaderboard_details:
        i += 1
        # Site stuff?
        project = Project.objects.get_or_create(
            name=f"{start_year}: {duration} year {category}",
            start_date=datetime(start_year, 1, 1),
            close_date=datetime(start_year + duration, 1, 1),
            type=Project.ProjectTypes.GLOBAL_LEADERBOARD,
            leaderboard_type=category,
        )[0]
        print("setting up global leaderboard", i, "/", c, project.name, end="\r")
        # TODO: This filter is not at all correct, but it approximates the result
        project_posts = Post.objects.filter(
            question__isnull=False,
            published_at__gte=project.start_date,
            published_at__lt=project.start_date + timedelta(days=365),
            question__closed_at__lt=project.close_date,
            question__closed_at__gte=project.close_date - timedelta(days=365),
        )
        for post in project_posts:
            post.projects.add(project)
            post.save()
    print()


def populate_global_leaderboards(qty: int | None = None):
    global_leaderboard_projects = Project.objects.filter(
        type=Project.ProjectTypes.GLOBAL_LEADERBOARD
    )
    if qty:
        global_leaderboard_projects = global_leaderboard_projects.order_by("?")[:qty]
    c = len(global_leaderboard_projects)
    for i, project in enumerate(global_leaderboard_projects, 1):
        print("populating:", i, "/", c, project.name, end="\r")
        create_leaderboard_entries(project)
        print(
            "populating:",
            i,
            "/",
            c,
            project.name,
            "(created",
            LeaderboardEntry.objects.filter(for_project=project).count(),
            "entries)",
        )


def populate_project_leaderboards(qty: int | None = None):
    projects_with_leaderboads = Project.objects.filter(
        type__in=[Project.ProjectTypes.TOURNAMENT, Project.ProjectTypes.QUESTION_SERIES]
    )
    if qty:
        projects_with_leaderboads = projects_with_leaderboads.order_by("?")[:qty]
    c = len(projects_with_leaderboads)
    for i, project in enumerate(projects_with_leaderboads, 1):
        print("populating:", i, "/", c, project.name, end="\r")
        create_leaderboard_entries(project)
        print(
            "populating:",
            i,
            "/",
            c,
            project.name,
            "(created",
            LeaderboardEntry.objects.filter(for_project=project).count(),
            "entries)",
        )

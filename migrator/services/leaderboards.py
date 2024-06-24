from datetime import datetime, timedelta
from collections import defaultdict

from posts.models import Post
from projects.models import Project, get_global_leaderboard_dates_and_score_types
from scoring.models import LeaderboardEntry
from scoring.utils import create_leaderboard_entries


def create_global_leaderboards():
    leaderboard_details = get_global_leaderboard_dates_and_score_types()

    # get all the posts and the leaderboard dates they are associated with
    scored_posts = Post.objects.filter(
        question__isnull=False,
        curation_status=Post.CurationStatus.RESOLVED,
    )
    gl_dates_posts = defaultdict(list)
    for post in scored_posts:
        gl_dates_posts[post.question.get_global_leaderboard_dates()].append(post)

    i = 0
    c = len(leaderboard_details)
    for start, end, leaderboard_type in leaderboard_details:
        i += 1
        # Site stuff?
        project = Project.objects.get_or_create(
            start_date=start,
            close_date=end,
            type=Project.ProjectTypes.GLOBAL_LEADERBOARD,
            leaderboard_type=leaderboard_type,
        )[0]
        project.name = f"{start.year}: {end.year - start.year} year {leaderboard_type}"
        project.save()
        if leaderboard_type in [
            Project.LeaderboardTypes.COMMENT_INSIGHT,
            Project.LeaderboardTypes.QUESTION_WRITING,
        ]:
            # there are no posts for these leaderboards
            continue
        print("setting up global leaderboard", i, "/", c, project.name, end="\r")
        project.posts.set(gl_dates_posts[(start, end)])
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

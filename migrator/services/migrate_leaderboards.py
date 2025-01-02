from projects.models import Project
from scoring.models import LeaderboardEntry
from scoring.utils import update_project_leaderboard


def populate_global_leaderboards():
    main_site_project = Project.objects.filter(
        type=Project.ProjectTypes.SITE_MAIN
    ).first()
    global_leaderboards = main_site_project.leaderboards.all().order_by("name")

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
    projects_with_leaderboards = Project.objects.filter(
        type__in=[Project.ProjectTypes.TOURNAMENT, Project.ProjectTypes.QUESTION_SERIES]
    ).exclude(name="Personal Project")
    c = len(projects_with_leaderboards)
    for i, project in enumerate(projects_with_leaderboards, 1):
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

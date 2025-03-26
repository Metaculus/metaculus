import csv
from datetime import timedelta
from typing import Any

from django.core.management.base import BaseCommand, CommandParser
from django.db import transaction
from django.db.models import Q

from posts.models import Post
from questions.models import Forecast, Question
from scoring.models import Leaderboard
from scoring.utils import score_question, update_project_leaderboard
from users.models import User


class Command(BaseCommand):
    help = "Simulates removing specified users from a leaderboard and shows the resulting rankings"

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "leaderboard_id",
            type=int,
            help="ID of the leaderboard to simulate changes on",
        )
        parser.add_argument(
            "usernames",
            nargs="+",
            type=str,
            help="List of usernames to simulate removing",
        )
        parser.add_argument(
            "--output",
            type=str,
            help="Optional path to save results as CSV",
            default=None,
        )

    def handle(self, *args: Any, **options: dict[str, Any]) -> None:
        try:
            leaderboard = Leaderboard.objects.get(id=options["leaderboard_id"])
            users = list(User.objects.filter(username__in=options["usernames"]))

            if not users:
                self.stdout.write(
                    self.style.ERROR("No valid users found with the provided usernames")
                )
                return

            self.stdout.write("Original leaderboard:")
            display_leaderboard(leaderboard)

            self.stdout.write("\nSimulating leaderboard without specified users...")
            updated_leaderboard = simulate_leaderboard_without_users(leaderboard, users)

            self.stdout.write("\nSimulated leaderboard:")
            display_leaderboard(updated_leaderboard)

            if options["output"]:
                file_path_to_save_to = options["output"]
                assert isinstance(file_path_to_save_to, str)
                _save_leaderboard_to_csv(updated_leaderboard, file_path_to_save_to)
                self.stdout.write(
                    self.style.SUCCESS(
                        f"\nResults saved to CSV file: {file_path_to_save_to}"
                    )
                )

        except Leaderboard.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(
                    f"Leaderboard with ID {options['leaderboard_id']} not found"
                )
            )


def simulate_leaderboard_without_users(
    leaderboard: Leaderboard,
    users: list[User],
) -> list[dict[str, Any]]:
    num_days = 365 * 500

    try:
        with transaction.atomic():
            print("\nMoving forecasts forward...")
            _move_leaderboard_forecasts_by_num_days(leaderboard, users, num_days)
            updated_leaderboard_json = _get_leaderboard_representation(leaderboard)

            # Force rollback to revert all changes
            transaction.set_rollback(True)
            print("\nRolling back all changes...")

    except Exception as e:
        print(f"\nError occurred: {str(e)}")
        print("Rolling back all changes...")
        transaction.set_rollback(True)
        raise

    return updated_leaderboard_json


def display_leaderboard(leaderboard: list[dict[str, Any]] | Leaderboard) -> None:
    if isinstance(leaderboard, Leaderboard):
        leaderboard_json = _get_leaderboard_representation(leaderboard)
    else:
        leaderboard_json = leaderboard

    print("Rank | Username | Score | Take | Prize")
    print("-" * 50)
    for entry in leaderboard_json:
        print(
            f"{entry['rank']:4d} | {entry['username']:20s} | {entry['score']:6.2f} | {entry['take']:6.2f} | {entry['prize']:6.2f}%"
        )


def _move_leaderboard_forecasts_by_num_days(
    leaderboard: Leaderboard,
    users: list[User],
    num_days: int,
) -> None:
    try:
        project = leaderboard.project

        # Get all posts in this project
        posts = Post.objects.filter(
            Q(default_project=project) | Q(projects=project)
        ).distinct()

        # Get all questions from these posts
        questions = Question.objects.filter(related_posts__post__in=posts).distinct()

        # Get all forecasts for these questions by these users
        forecasts = Forecast.objects.filter(question__in=questions, author__in=users)

        # Update each forecast's timestamp
        count = 0
        for forecast in forecasts:
            days_to_add = num_days
            forecast.start_time = forecast.start_time + timedelta(days=days_to_add)
            if forecast.end_time:
                forecast.end_time = forecast.end_time + timedelta(days=days_to_add)
            forecast.save()
            count += 1

        print(f"Updated {count} forecasts")

        # Rescore the affected questions
        for question in questions:
            resolution = question.resolution
            if not resolution or resolution in ["ambiguous", "annulled"]:
                continue
            score_question(
                question=question,
                resolution=resolution,
            )
        print(f"Rescored {len(questions)} questions")

        # Force update the leaderboard
        print("Force updating leaderboard...")
        update_project_leaderboard(
            project=project, leaderboard=leaderboard, force_update=True
        )
        print("Leaderboard updated successfully")

    except User.DoesNotExist:
        print("User not found")


def _save_leaderboard_to_csv(
    leaderboard_data: list[dict[str, Any]], output_path: str
) -> None:
    with open(output_path, "w", newline="") as csvfile:
        fieldnames = ["rank", "username", "score", "take", "prize"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        writer.writeheader()
        writer.writerows(leaderboard_data)


def _get_leaderboard_representation(leaderboard: Leaderboard) -> list[dict[str, Any]]:
    entries = leaderboard.entries.select_related("user").order_by("rank")

    return [
        {
            "rank": entry.rank if entry.rank is not None else -1,
            "username": entry.user.username if entry.user else "N/A",
            "score": round(entry.score, 2) if entry.score is not None else -1,
            "take": round(entry.take, 2) if entry.take is not None else -1,
            "prize": round(entry.prize, 2) if entry.prize is not None else -1,
        }
        for entry in entries
    ]

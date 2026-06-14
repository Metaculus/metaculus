from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0023_alter_project_bot_leaderboard_status"),
    ]

    operations = [
        # Swap close_date and forecasting_end_date via a temporary name.
        # close_date (old: tournament wrap-up) -> winners_announced_date
        # forecasting_end_date (old: last scored question close) -> close_date
        migrations.RenameField(
            model_name="project",
            old_name="close_date",
            new_name="_winners_announced_date_tmp",
        ),
        migrations.RenameField(
            model_name="project",
            old_name="forecasting_end_date",
            new_name="close_date",
        ),
        migrations.RenameField(
            model_name="project",
            old_name="_winners_announced_date_tmp",
            new_name="winners_announced_date",
        ),
        migrations.AlterField(
            model_name="project",
            name="winners_announced_date",
            field=models.DateTimeField(
                blank=True,
                help_text=(
                    "The date the tournament wraps up and prizes will be paid. "
                    "All questions that should be included in the leaderboard must close and resolve before this date."
                ),
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="project",
            name="close_date",
            field=models.DateTimeField(
                blank=True,
                help_text=(
                    "The date the last question that counts for the tournament is scheduled to close. "
                    "If such questions have scheduled close dates after the project Winners announced date, "
                    "the front end will show the latest of these close dates."
                ),
                null=True,
            ),
        ),
    ]

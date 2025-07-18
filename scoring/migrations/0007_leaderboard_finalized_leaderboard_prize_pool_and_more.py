# Generated by Django 5.1.4 on 2025-01-16 19:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("scoring", "0006_alter_leaderboardentry_excluded_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="leaderboard",
            name="finalized",
            field=models.BooleanField(
                default=False,
                help_text="If true, this Leaderboard's entries cannot be updated except by a manual action in the admin panel. Automatically set to True the first time this leaderboard is updated after the finalize_time.",
            ),
        ),
        migrations.AddField(
            model_name="leaderboard",
            name="prize_pool",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                default=None,
                help_text="Optional. If not set, the Project's prize_pool will be used instead.\n        </br>- If the Project has a prize pool, but this leaderboard has none, set this to 0.\n        ",
                max_digits=15,
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="leaderboard",
            name="end_time",
            field=models.DateTimeField(
                blank=True,
                help_text="Optional (required for global leaderboards).\n        </br>- Global Leaderboards: filters for questions that have a scheduled_close_time before this (plus a grace period). Automatically set, do not change.\n        </br>- Non-Global Leaderboards: has no effect on question filtering.\n        </br>- Filtering MedalExclusionRecords: MedalExclusionRecords that have a start_time less than this (and no end_time or an end_time later that this Leaderboard's start_time) will be triggered. If not set, this Leaderboard's finalize_time will be used instead - it is recommended not to use this field unless required.\n        ",
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="leaderboard",
            name="finalize_time",
            field=models.DateTimeField(
                blank=True,
                help_text="Optional. If not set, the Project's close_date will be used instead.\n        </br>- For all Leaderboards: used to filter out questions that have a resolution_set_time after this (as they were resolved after this Leaderboard was finalized).\n        </br>- Filtering MedalExclusionRecords: If set and end_time is not set, MedalExclusionRecords that have a start_time less than this (and no end_time or an end_time later that this Leaderboard's start_time) will be triggered.\n        ",
                null=True,
            ),
        ),
        migrations.AlterField(
            model_name="leaderboard",
            name="score_type",
            field=models.CharField(
                choices=[
                    ("peer_tournament", "Peer Tournament"),
                    ("default", "Default"),
                    ("spot_peer_tournament", "Spot Peer Tournament"),
                    ("spot_baseline_tournament", "Spot Baseline Tournament"),
                    ("relative_legacy_tournament", "Relative Legacy Tournament"),
                    ("baseline_global", "Baseline Global"),
                    ("peer_global", "Peer Global"),
                    ("peer_global_legacy", "Peer Global Legacy"),
                    ("comment_insight", "Comment Insight"),
                    ("question_writing", "Question Writing"),
                    ("manual", "Manual"),
                ],
                help_text="\n    <table>\n        <tr><td>peer_tournament</td><td> Sum of peer scores. Most likely what you want.</td></tr>\n        <tr><td>default</td><td> Sum of 'Default' scores as determined by each Question's 'default_score_type'</td></tr>\n        <tr><td>spot_peer_tournament</td><td> Sum of spot peer scores.</td></tr>\n        <tr><td>spot_baseline_tournament</td><td> Sum of spot baseline scores.</td></tr>\n        <tr><td>relative_legacy</td><td> Old site scoring.</td></tr>\n        <tr><td>baseline_global</td><td> Sum of baseline scores.</td></tr>\n        <tr><td>peer_global</td><td> Coverage-weighted average of peer scores.</td></tr>\n        <tr><td>peer_global_legacy</td><td> Average of peer scores.</td></tr>\n        <tr><td>comment_insight</td><td> H-index of upvotes for comments on questions.</td></tr>\n        <tr><td>question_writing</td><td> H-index of number of forecasters / 10 on questions.</td></tr>\n        <tr><td>manual</td><td> Does not automatically update. Manually set all entries.</td></tr>\n    </table>\n    ",
                max_length=200,
            ),
        ),
        migrations.AlterField(
            model_name="leaderboard",
            name="start_time",
            field=models.DateTimeField(
                blank=True,
                help_text="Optional (required for global leaderboards). If not set, the Project's open_date will be used instead.\n        </br>- Global Leaderboards: filters for questions that have an open time after this. Automatically set, do not change.\n        </br>- Non-Global Leaderboards: has no effect on question filtering.\n        </br>- Filtering MedalExclusionRecords: MedalExclusionRecords that have no end_time or an end_time greater than this (and a start_time before this Leaderboard's end_time or finalize_time) will be triggered.\n        ",
                null=True,
            ),
        ),
    ]

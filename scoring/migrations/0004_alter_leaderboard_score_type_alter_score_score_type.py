# Generated by Django 5.1.1 on 2024-10-18 16:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('scoring', '0003_alter_leaderboard_name_alter_leaderboard_project_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='leaderboard',
            name='score_type',
            field=models.CharField(choices=[('relative_legacy_tournament', 'Relative Legacy Tournament'), ('peer_global', 'Peer Global'), ('peer_global_legacy', 'Peer Global Legacy'), ('peer_tournament', 'Peer Tournament'), ('spot_peer_tournament', 'Spot Peer Tournament'), ('baseline_global', 'Baseline Global'), ('comment_insight', 'Comment Insight'), ('question_writing', 'Question Writing'), ('manual', 'Manual')], max_length=200),
        ),
        migrations.AlterField(
            model_name='score',
            name='score_type',
            field=models.CharField(choices=[('relative_legacy', 'Relative Legacy'), ('peer', 'Peer'), ('baseline', 'Baseline'), ('spot_peer', 'Spot Peer'), ('spot_baseline', 'Spot Baseline'), ('manual', 'Manual')], max_length=200),
        ),
    ]

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("questions", "0007_question_question_weight"),
    ]

    operations = [
        migrations.AlterField(
            model_name="question",
            name="label",
            field=models.TextField(blank=True, default=""),
            preserve_default=False,
        ),
    ]

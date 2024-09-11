from django.db import models


class MailingTags(models.TextChoices):
    FORECASTED_QUESTION_RESOLUTION = "question_resolution"
    COMMENT_MENTIONS = "comment_mentions"
    # Forecasted post CP change
    FORECASTED_CP_CHANGE = "cp_change"
    TOURNAMENT_NEW_QUESTIONS = "tournament_new_questions"

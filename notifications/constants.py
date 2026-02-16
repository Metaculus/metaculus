from django.db import models


class MailingTags(models.TextChoices):
    # news
    WEEKLY_TOP_COMMENTS = "weekly_top_comments"
    METACULUS_NEWS = "metaculus_news"

    # keeping up
    COMMENT_MENTIONS = "comment_mentions"
    FORECASTED_QUESTION_RESOLUTION = "question_resolution"
    TOURNAMENT_NEW_QUESTIONS = "tournament_new_questions"
    FORECASTED_CP_CHANGE = "cp_change"
    BEFORE_PREDICTION_AUTO_WITHDRAWAL = "before_prediction_auto_withdrawal"


class MailingTags(models.TextChoices):
    FORECASTED_QUESTION_RESOLUTION = "question_resolution"
    COMMENT_MENTIONS = "comment_mentions"
    # Forecasted post CP change
    FORECASTED_CP_CHANGE = "cp_change"
    TOURNAMENT_NEW_QUESTIONS = "tournament_new_questions"
    BEFORE_PREDICTION_AUTO_WITHDRAWAL = "before_prediction_auto_withdrawal"
    WEEKLY_TOP_COMMENTS = "weekly_top_comments"

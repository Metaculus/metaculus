from django.db import models


class ScoreTypes(models.TextChoices):
    RELATIVE_LEGACY = "relative_legacy"
    PEER = "peer"
    BASELINE = "baseline"
    SPOT_PEER = "spot_peer"
    SPOT_BASELINE = "spot_baseline"
    MANUAL = "manual"


class ExclusionStatuses(models.IntegerChoices):
    INCLUDE = 0
    EXCLUDE_PRIZE_ONLY = 1
    EXCLUDE_AND_SHOW = 2
    EXCLUDE_AND_SHOW_IN_ADVANCED = 3
    EXCLUDE = 4


class ArchivedScoreTypes(models.TextChoices):
    RELATIVE_LEGACY = "relative_legacy"


class LeaderboardScoreTypes(models.TextChoices):
    PEER_TOURNAMENT = "peer_tournament"
    DEFAULT = "default"
    SPOT_PEER_TOURNAMENT = "spot_peer_tournament"
    SPOT_BASELINE_TOURNAMENT = "spot_baseline_tournament"
    RELATIVE_LEGACY_TOURNAMENT = "relative_legacy_tournament"
    BASELINE_GLOBAL = "baseline_global"
    PEER_GLOBAL = "peer_global"
    PEER_GLOBAL_LEGACY = "peer_global_legacy"
    COMMENT_INSIGHT = "comment_insight"
    QUESTION_WRITING = "question_writing"
    MANUAL = "manual"

    @classmethod
    def get_base_score(cls, score_type: str) -> ScoreTypes | None:
        match score_type:
            case cls.DEFAULT:
                return None
            case cls.RELATIVE_LEGACY_TOURNAMENT:
                return ScoreTypes.RELATIVE_LEGACY
            case cls.PEER_GLOBAL:
                return ScoreTypes.PEER
            case cls.PEER_GLOBAL_LEGACY:
                return ScoreTypes.PEER
            case cls.PEER_TOURNAMENT:
                return ScoreTypes.PEER
            case cls.SPOT_PEER_TOURNAMENT:
                return ScoreTypes.SPOT_PEER
            case cls.SPOT_BASELINE_TOURNAMENT:
                return ScoreTypes.SPOT_BASELINE
            case cls.BASELINE_GLOBAL:
                return ScoreTypes.BASELINE
            case cls.MANUAL:
                return ScoreTypes.MANUAL
            case cls.COMMENT_INSIGHT:
                raise ValueError("Comment insight leaderboards do not have base scores")
            case cls.QUESTION_WRITING:
                raise ValueError(
                    "Question Writing leaderboards do not have base scores"
                )
        return None

from django_dynamic_fixture import G

from coherence.models import AggregateCoherenceLink, AggregateCoherenceLinkVote
from questions.models import Question
from users.models import User
from utils.dtypes import setdefaults_not_null


def factory_aggregate_coherence_link(
    *, question1=Question, question2=Question, **kwargs
) -> AggregateCoherenceLink:
    return G(
        AggregateCoherenceLink,
        **setdefaults_not_null(
            kwargs,
            question1=question1,
            question2=question2,
        )
    )


def factory_agg_link_vote(
    *,
    aggregation: AggregateCoherenceLink = None,
    score: int = None,
    user: User = None,
    **kwargs
) -> AggregateCoherenceLinkVote:
    return G(
        AggregateCoherenceLinkVote,
        **setdefaults_not_null(kwargs, aggregation=aggregation, score=score, user=user)
    )

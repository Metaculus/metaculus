from django_dynamic_fixture import G

from misc.models import ITNArticle
from utils.dtypes import setdefaults_not_null


def factory_itn_article(*, title: str = None, **kwargs) -> ITNArticle:
    return G(ITNArticle, **setdefaults_not_null(kwargs, title=title))

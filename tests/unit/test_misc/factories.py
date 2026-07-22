from django_dynamic_fixture import G

from misc.models import AdTile, ITNArticle
from utils.dtypes import setdefaults_not_null


def factory_itn_article(
    *, title: str = None, cluster_id: int = None, post_count: int = 0, **kwargs
) -> ITNArticle:
    # Default to a dedicated (own) cluster and no breadth penalty so each article
    # is scored independently unless a test opts into clustering / post_count.
    return G(
        ITNArticle,
        cluster_id=cluster_id,
        post_count=post_count,
        **setdefaults_not_null(kwargs, title=title),
    )


def factory_ad_tile(
    *,
    title: str = "Ad",
    url: str = "https://example.com/",
    is_active: bool = True,
    order: int = 0,
    exposure_rate: int = 100,
    image=None,
    project=None,
    **kwargs,
) -> AdTile:
    return G(
        AdTile,
        image=image,
        project=project,
        **setdefaults_not_null(
            kwargs,
            title=title,
            url=url,
            is_active=is_active,
            order=order,
            exposure_rate=exposure_rate,
        ),
    )

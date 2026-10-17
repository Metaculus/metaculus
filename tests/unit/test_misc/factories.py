from django_dynamic_fixture import G

from misc.models import AdTile, ITNArticle, default_ad_tile_placements
from utils.dtypes import setdefaults_not_null


def factory_itn_article(
    *, title: str = None, cluster_id: int = None, **kwargs
) -> ITNArticle:
    # Default to a dedicated (own) cluster so each article is scored independently
    # unless a test opts into clustering.
    return G(
        ITNArticle,
        cluster_id=cluster_id,
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
    placements: list[str] | None = None,
    **kwargs,
) -> AdTile:
    return G(
        AdTile,
        image=image,
        project=project,
        placements=(default_ad_tile_placements() if placements is None else placements),
        **setdefaults_not_null(
            kwargs,
            title=title,
            url=url,
            is_active=is_active,
            order=order,
            exposure_rate=exposure_rate,
        ),
    )

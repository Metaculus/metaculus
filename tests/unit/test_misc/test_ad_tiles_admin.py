from misc.admin import AdTileAdminForm
from posts.models import Post
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project


def make_form(**overrides) -> AdTileAdminForm:
    data = {
        "title": "Promo",
        "url": "https://metaculus.com/x/",
        "is_active": True,
        "order": 0,
        "exposure_rate": 100,
        "placements": ["question_sidebar"],
        **overrides,
    }
    return AdTileAdminForm(data=data)


def test_targeting_public_post_and_project_is_valid():
    assert make_form(target_post=factory_post().pk).is_valid()
    assert make_form(target_project=factory_project().pk).is_valid()


def test_targeting_private_post_is_rejected():
    post = factory_post(default_project=factory_project(default_permission=None))
    form = make_form(target_post=post.pk)

    assert not form.is_valid()
    assert "target_post" in form.errors


def test_targeting_unpublished_post_is_rejected():
    post = factory_post(curation_status=Post.CurationStatus.PENDING)
    form = make_form(target_post=post.pk)

    assert not form.is_valid()
    assert "target_post" in form.errors


def test_targeting_private_project_is_rejected():
    form = make_form(target_project=factory_project(default_permission=None).pk)

    assert not form.is_valid()
    assert "target_project" in form.errors

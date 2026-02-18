from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.reverse import reverse
from rest_framework.test import APIClient

from projects.permissions import ObjectPermission
from tests.unit.test_comments.factories import factory_comment
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_users.factories import factory_user


class TestUserSearchWithPostId:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.url = reverse("users-list")
        # Clear cached recently-active set so each test sees fresh data
        from users.services.common import get_recently_active_user_ids

        get_recently_active_user_ids.clear_cache()

    def _make_recently_active(self, user):
        """
        Give the user a recent non-deleted comment so they pass the activity filter.
        """
        other_post = factory_post(author=factory_user())
        factory_comment(author=user, on_post=other_post)

    def test_search_with_post_id_prioritizes_commenters(
        self, anon_client: APIClient
    ) -> None:
        post_author = factory_user(username="postauthor")
        commenter = factory_user(username="commenterabc")
        non_commenter = factory_user(username="commenterdef")
        self._make_recently_active(non_commenter)

        post = factory_post(author=post_author)
        factory_comment(author=commenter, on_post=post)

        response = anon_client.get(f"{self.url}?search=commenter&post_id={post.pk}")

        assert response.status_code == status.HTTP_200_OK
        results = response.data
        usernames = [r["username"] for r in results]
        assert "commenterabc" in usernames
        assert "commenterdef" in usernames
        # Commenter on the post should appear before non-commenter
        assert usernames.index("commenterabc") < usernames.index("commenterdef")

    def test_search_with_post_id_prioritizes_post_author(
        self, anon_client: APIClient
    ) -> None:
        author = factory_user(username="authorxyz")
        other_user = factory_user(username="authorabc")
        self._make_recently_active(other_user)

        project = factory_project()
        post = factory_post(author=author, default_project=project)

        response = anon_client.get(f"{self.url}?search=author&post_id={post.pk}")

        assert response.status_code == status.HTTP_200_OK
        results = response.data
        usernames = [r["username"] for r in results]
        assert "authorxyz" in usernames
        # Post author should appear first
        assert usernames.index("authorxyz") < usernames.index("authorabc")

    def test_search_with_post_id_prioritizes_project_permission_users(
        self, anon_client: APIClient
    ) -> None:
        post_author = factory_user(username="theauthor")
        permitted_user = factory_user(username="searchuser1")
        non_permitted_user = factory_user(username="searchuser2")
        self._make_recently_active(non_permitted_user)

        project = factory_project(
            override_permissions={
                permitted_user: ObjectPermission.FORECASTER,
            },
        )
        post = factory_post(author=post_author, default_project=project)

        response = anon_client.get(f"{self.url}?search=searchuser&post_id={post.pk}")

        assert response.status_code == status.HTTP_200_OK
        results = response.data
        usernames = [r["username"] for r in results]
        assert "searchuser1" in usernames
        assert "searchuser2" in usernames
        # User with project permission should appear before non-permitted user
        assert usernames.index("searchuser1") < usernames.index("searchuser2")

    def test_post_id_only_returns_relevant_users(self, anon_client: APIClient) -> None:
        post_author = factory_user(username="relevauthor")
        commenter = factory_user(username="relevcommenter")
        factory_user(username="irrelevantuser")

        project = factory_project()
        post = factory_post(author=post_author, default_project=project)
        factory_comment(author=commenter, on_post=post)

        response = anon_client.get(f"{self.url}?post_id={post.pk}")

        assert response.status_code == status.HTTP_200_OK
        results = response.data
        usernames = [r["username"] for r in results]
        assert "relevauthor" in usernames
        assert "relevcommenter" in usernames
        assert "irrelevantuser" not in usernames

    def test_search_without_post_id_or_search_returns_error(
        self, anon_client: APIClient
    ) -> None:
        response = anon_client.get(self.url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_search_without_post_id_works_normally(
        self, anon_client: APIClient
    ) -> None:
        user = factory_user(username="normalsearch")
        self._make_recently_active(user)
        response = anon_client.get(f"{self.url}?search=normalsearch")

        assert response.status_code == status.HTTP_200_OK
        results = response.data
        assert any(r["username"] == "normalsearch" for r in results)

    def test_post_id_with_nonexistent_post_returns_empty(
        self, anon_client: APIClient
    ) -> None:
        response = anon_client.get(f"{self.url}?search=someuser&post_id=999999")

        assert response.status_code == status.HTTP_200_OK
        assert response.data == []

    def test_search_with_post_id_prioritizes_coauthors(
        self, anon_client: APIClient
    ) -> None:
        author = factory_user(username="mainauthor")
        coauthor = factory_user(username="coauthortest")
        other_user = factory_user(username="coauthorfake")
        self._make_recently_active(other_user)

        post = factory_post(author=author)
        post.coauthors.add(coauthor)

        response = anon_client.get(f"{self.url}?search=coauthor&post_id={post.pk}")

        assert response.status_code == status.HTTP_200_OK
        results = response.data
        usernames = [r["username"] for r in results]
        assert "coauthortest" in usernames
        assert "coauthorfake" in usernames
        # Coauthor should appear before non-coauthor
        assert usernames.index("coauthortest") < usernames.index("coauthorfake")

    def test_combined_relevance_ordering(self, anon_client: APIClient) -> None:
        """
        Commenters should rank highest, then authors, then permission holders,
        then other users.
        """
        author = factory_user(username="testrank_author")
        commenter = factory_user(username="testrank_commenter")
        permitted = factory_user(username="testrank_permitted")
        nobody = factory_user(username="testrank_nobody")
        self._make_recently_active(nobody)

        project = factory_project(
            override_permissions={
                permitted: ObjectPermission.FORECASTER,
            },
        )
        post = factory_post(author=author, default_project=project)
        factory_comment(author=commenter, on_post=post)

        response = anon_client.get(f"{self.url}?search=testrank&post_id={post.pk}")

        assert response.status_code == status.HTTP_200_OK
        results = response.data
        usernames = [r["username"] for r in results]

        # Enforce full ordering: commenter > author > permitted > nobody
        assert usernames.index("testrank_commenter") < usernames.index(
            "testrank_author"
        )
        assert usernames.index("testrank_author") < usernames.index(
            "testrank_permitted"
        )
        assert usernames.index("testrank_permitted") < usernames.index(
            "testrank_nobody"
        )

    def test_inactive_users_excluded_from_search(self, anon_client: APIClient) -> None:
        """Users without recent comments should not appear in non-priority results."""
        post_author = factory_user(username="filterauthor")
        active_user = factory_user(username="filteractive")
        factory_user(username="filterinactive")

        # Give active_user a recent comment
        self._make_recently_active(active_user)

        # inactive_user has no comments at all

        post = factory_post(author=post_author)

        response = anon_client.get(f"{self.url}?search=filter&post_id={post.pk}")

        assert response.status_code == status.HTTP_200_OK
        results = response.data
        usernames = [r["username"] for r in results]
        # Post author appears (priority user)
        assert "filterauthor" in usernames
        # Active user appears (has recent comment)
        assert "filteractive" in usernames
        # Inactive user excluded (no recent comment, not a priority user)
        assert "filterinactive" not in usernames

    def test_old_comments_dont_count_as_recent(self, anon_client: APIClient) -> None:
        """Users whose only comments are older than a year should be excluded."""
        old_user = factory_user(username="oldcommentor")
        other_post = factory_post(author=factory_user())
        factory_comment(
            author=old_user,
            on_post=other_post,
            created_at=timezone.now() - timedelta(days=400),
        )

        response = anon_client.get(f"{self.url}?search=oldcommentor")

        assert response.status_code == status.HTTP_200_OK
        results = response.data
        usernames = [r["username"] for r in results]
        assert "oldcommentor" not in usernames

    def test_deleted_comments_dont_count_as_recent(
        self, anon_client: APIClient
    ) -> None:
        """Users whose only recent comments are soft-deleted should be excluded."""
        deleted_user = factory_user(username="deletedcommentor")
        other_post = factory_post(author=factory_user())
        factory_comment(
            author=deleted_user,
            on_post=other_post,
            is_soft_deleted=True,
        )

        response = anon_client.get(f"{self.url}?search=deletedcommentor")

        assert response.status_code == status.HTTP_200_OK
        results = response.data
        usernames = [r["username"] for r in results]
        assert "deletedcommentor" not in usernames

from posts.services.common import (
    get_conditional_categories,
    sync_conditional_categories,
    update_post,
)
from projects.models import Project
from questions.models import Question
from tests.unit.test_posts.factories import factory_post
from tests.unit.test_projects.factories import factory_project
from tests.unit.test_questions.factories import create_conditional, create_question


class TestConditionalCategoryPropagation:
    def _make_conditional_setup(self):
        """Create condition and child questions with their own posts and categories."""
        cat_a = factory_project(type=Project.ProjectTypes.CATEGORY, name="Category A")
        cat_b = factory_project(type=Project.ProjectTypes.CATEGORY, name="Category B")
        cat_c = factory_project(type=Project.ProjectTypes.CATEGORY, name="Category C")

        condition = create_question(
            question_type=Question.QuestionType.BINARY,
        )
        condition_child = create_question(
            question_type=Question.QuestionType.BINARY,
        )

        factory_post(
            question=condition,
            projects=[cat_a, cat_b],
        )
        factory_post(
            question=condition_child,
            projects=[cat_b, cat_c],
        )

        conditional = create_conditional(
            condition=condition,
            condition_child=condition_child,
            question_yes=create_question(
                question_type=Question.QuestionType.BINARY,
                title="If Yes",
            ),
            question_no=create_question(
                question_type=Question.QuestionType.BINARY,
                title="If No",
            ),
        )

        return conditional, cat_a, cat_b, cat_c

    def test_get_conditional_categories(self):
        conditional, cat_a, cat_b, cat_c = self._make_conditional_setup()

        categories = get_conditional_categories(conditional)
        category_ids = {c.id for c in categories}

        assert cat_a.id in category_ids
        assert cat_b.id in category_ids
        assert cat_c.id in category_ids

    def test_sync_conditional_categories(self):
        conditional, cat_a, cat_b, cat_c = self._make_conditional_setup()

        post = factory_post(conditional=conditional)
        sync_conditional_categories(post)

        post_categories = set(post.projects.filter(type=Project.ProjectTypes.CATEGORY))
        assert cat_a in post_categories
        assert cat_b in post_categories
        assert cat_c in post_categories

    def test_sync_conditional_categories_no_duplicates(self):
        conditional, cat_a, cat_b, cat_c = self._make_conditional_setup()

        post = factory_post(conditional=conditional, projects=[cat_a])
        sync_conditional_categories(post)

        cat_a_count = post.projects.filter(
            type=Project.ProjectTypes.CATEGORY, id=cat_a.id
        ).count()
        assert cat_a_count == 1

    def test_sync_noop_for_non_conditional(self):
        question = create_question(
            question_type=Question.QuestionType.BINARY,
        )
        post = factory_post(question=question)

        # Should not raise
        sync_conditional_categories(post)

    def test_update_post_categories_preserves_inherited(self, mocker):
        """
        Regression: calling update_post(..., categories=[...]) on a conditional
        post must not drop categories inherited from parent/child questions,
        even when no `conditional` payload is passed.
        """
        # Avoid downstream side effects that aren't relevant to this test
        mocker.patch("posts.tasks.run_post_indexing.send")

        conditional, cat_a, cat_b, cat_c = self._make_conditional_setup()
        post = factory_post(conditional=conditional)
        sync_conditional_categories(post)

        # Sanity check: inherited categories are present before the update
        initial_categories = set(
            post.projects.filter(type=Project.ProjectTypes.CATEGORY)
        )
        assert {cat_a, cat_b, cat_c} <= initial_categories

        # User edits the post with only cat_a in the categories payload
        update_post(post, categories=[cat_a])

        post_categories = set(
            post.projects.filter(type=Project.ProjectTypes.CATEGORY)
        )
        # Inherited categories must still be present
        assert cat_a in post_categories
        assert cat_b in post_categories
        assert cat_c in post_categories

        # And cat_a should not have been duplicated
        cat_a_count = post.projects.filter(
            type=Project.ProjectTypes.CATEGORY, id=cat_a.id
        ).count()
        assert cat_a_count == 1

    def test_get_conditional_categories_missing_posts(self):
        """Categories should be collected even if one parent has no post."""
        condition = create_question(
            question_type=Question.QuestionType.BINARY,
        )
        condition_child = create_question(
            question_type=Question.QuestionType.BINARY,
        )

        cat = factory_project(type=Project.ProjectTypes.CATEGORY, name="Only Cat")
        factory_post(question=condition, projects=[cat])
        # condition_child has no post (post_id is None)

        conditional = create_conditional(
            condition=condition,
            condition_child=condition_child,
            question_yes=create_question(
                question_type=Question.QuestionType.BINARY,
                title="If Yes",
            ),
            question_no=create_question(
                question_type=Question.QuestionType.BINARY,
                title="If No",
            ),
        )

        categories = get_conditional_categories(conditional)
        assert len(categories) == 1
        assert categories[0].id == cat.id

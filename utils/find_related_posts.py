import math
from posts.services.search import perform_post_search
from utils.call_llm import call_llm
from posts.models import Post, RelatedPost
from django.db.models import Q

MAX_RELATED_POSTS = 3


def generate_llm_description_for_post(post: Post):
    return ""


def find_related_posts(post: Post):
    realted_posts = RelatedPost.objects.filter(Q(Q(post1=post) | Q(post2=post))).all()
    if len(realted_posts) >= MAX_RELATED_POSTS:
        return
    nr_related_posts_to_generate = MAX_RELATED_POSTS - len(realted_posts)
    related_posts = Post.objects.filter(curation_status=Post.CurationStatus.APPROVED)
    related_posts = perform_post_search(related_posts, str(post.title))
    related_posts = related_posts.filter(rank__isnull=False).order_by("-rank")
    related_post_objects = []
    for related_post in related_posts:
        if related_post.id == post.id:
            continue
        related_post_objects.append(RelatedPost(post1=post, post2=related_post))
        if len(related_post_objects) >= nr_related_posts_to_generate:
            break

    RelatedPost.objects.bulk_create(related_post_objects)


def populated_all_related_posts():
    all_posts = list(
        Post.objects.filter(curation_status=Post.CurationStatus.APPROVED)
        .annotate_vote_score()
        .order_by("-vote_score")
        .all()
    )
    for index, post in enumerate(all_posts):
        find_related_posts(post)

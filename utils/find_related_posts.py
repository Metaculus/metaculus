import math
from utils.call_llm import call_llm
from posts.models import Post, RelatedPost
from django.db.models import Q

MAX_RELATED_POSTS = 3

def generate_llm_description_for_post(post: Post):

    return ""

def find_related_posts(post: Post):
    realted_posts = RelatedPost.objects.filter(Q(
        Q(post1=post) | Q(post2=post)
    )).all()
    if len(realted_posts) >= MAX_RELATED_POSTS:
        return
    nr_related_posts_to_generate = MAX_RELATED_POSTS - len(realted_posts)
    all_posts = list(Post.objects.filter(curation_status=Post.CurationStatus.APPROVED).annotate_vote_score().order_by("vote_score").all())

    batch_size = 50
    for i in range(0, math.ceil(len(all_posts)/batch_size)):
        all_posts[i * batch_size:i * batch_size + batch_size]
    

    top_related_posts = [all_posts[1], all_posts[2], all_posts[3]]

    for related_post in top_related_posts:
        if nr_related_posts_to_generate < 1:
            return
        else:
            related_post = RelatedPost(
                post1=post,
                post2=related_post,
            )
            related_post.save()

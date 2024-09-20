from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response


class CountlessLimitOffsetPagination(LimitOffsetPagination):
    """
    We don't always need to extract total records count
    Which also might be expensive sometimes
    """

    def get_count(self, queryset):
        return float("inf")

    def get_paginated_response(self, data):
        return Response(
            {
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "results": data,
            }
        )

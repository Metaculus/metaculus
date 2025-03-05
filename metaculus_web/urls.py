"""
URL configuration for metaculus_web project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.generic import TemplateView

import comments
import posts
import questions

urlpatterns = [
    path("admin/fab-management/", include("fab_management.urls")),
    path("admin/", admin.site.urls),
    path(
        "api/",
        TemplateView.as_view(
            template_name="swagger-ui.html",
        ),
        name="swagger-ui",
    ),
    path("api/", include("users.urls")),
    path("api/", include("authentication.urls")),
    path("api/", include("projects.urls")),
    path("api/", include("posts.urls")),
    path("api/", include("questions.urls")),
    path("api/", include("comments.urls")),
    path("api/", include("scoring.urls")),
    path("api/", include("utils.urls")),
    path("api/", include("misc.urls")),
    # Backward compatibility endpoints
    path("api2/", include(comments.urls.old_api)),
    path("api2/", include(posts.urls.old_api)),
    path("api2/", include(questions.urls.old_api)),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

if settings.DEBUG:
    urlpatterns += [
        path("__debug__/", include("debug_toolbar.urls")),
    ]

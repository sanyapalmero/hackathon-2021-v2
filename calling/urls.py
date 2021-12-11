from django.urls import path
from django.urls.conf import include
from rest_framework.routers import DefaultRouter

from . import views

app_name = "calling"

router = DefaultRouter()
router.register('contacts', views.ContactViewSet)

urlpatterns = [
    path("", views.HomeView.as_view(), name="home"),
    path("", include(router.urls))
]

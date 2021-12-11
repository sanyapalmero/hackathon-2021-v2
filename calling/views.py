from django.views import generic
from rest_framework import viewsets
from rest_framework import filters

from .serializers import ContactSerializer
from .models import Contact



class HomeView(generic.TemplateView):
    template_name = "calling/home.html"


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    filter_backends = (filters.SearchFilter,)
    lookup_field = ('number')
    search_fields = ('name', 'number') 
    
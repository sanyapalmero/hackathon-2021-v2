from django.db import models
from django.core.validators import MinLengthValidator


class Contact(models.Model):
    name = models.CharField(max_length=256, blank=False,  verbose_name='Контакт')
    number = models.CharField(max_length=4, validators=[MinLengthValidator(4)], blank=False, unique=True, verbose_name='Номер')


    class Meta:
        ordering = ['name']

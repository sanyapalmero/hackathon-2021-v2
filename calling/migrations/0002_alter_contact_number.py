# Generated by Django 3.2 on 2021-12-11 08:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('calling', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='contact',
            name='number',
            field=models.CharField(max_length=4, unique=True, verbose_name='Номер'),
        ),
    ]

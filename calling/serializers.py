from rest_framework import fields, serializers
from .models import Contact


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ('name', 'number')

    def validate_number(self, number):
        if number.isdigit():
            return number
        raise serializers.ValidationError('Поле состоит из цифр(')

from rest_framework import serializers

from .models import InteractionVocale


class InteractionVocaleSerializer(serializers.ModelSerializer):
    class Meta:
        model = InteractionVocale
        fields = [
            'id', 'audio_question', 'transcription',
            'reponse_texte', 'audio_reponse', 'date_creation',
        ]
        read_only_fields = fields
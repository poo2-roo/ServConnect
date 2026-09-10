from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class ConnexionSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        maintenant = timezone.now()

        if user.est_bloque:
            raise serializers.ValidationError({
                'code': 'bloque',
                'detail': "Votre compte a été bloqué définitivement.",
                'motif': user.motif_sanction or "Aucun motif renseigné.",
            })

        if user.date_fin_suspension and user.date_fin_suspension > maintenant:
            raise serializers.ValidationError({
                'code': 'suspendu',
                'detail': "Votre compte est temporairement suspendu.",
                'motif': user.motif_sanction or "Aucun motif renseigné.",
                'date_fin_suspension': user.date_fin_suspension.isoformat(),
            })

        return data


class ConnexionView(TokenObtainPairView):
    serializer_class = ConnexionSerializer
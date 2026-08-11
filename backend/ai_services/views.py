from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .chatbot_vocal import traiter_question_vocale
from .gemini_client import ErreurAppelIA
from .models import InteractionVocale
from .serializers import InteractionVocaleSerializer


class ChatbotVocalView(APIView):
    """POST /api/ai/chatbot-vocal/ — envoie un audio, reçoit transcription + réponse + audio."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        fichier_audio = request.FILES.get('audio')
        if fichier_audio is None:
            raise ValidationError("Le fichier audio ('audio') est obligatoire.")

        try:
            resultat = traiter_question_vocale(
                fichier_audio.read(),
                audio_mime_type=fichier_audio.content_type or 'audio/mp3',
                utilisateur=request.user,
            )
        except ErreurAppelIA as exc:
            return Response({"detail": str(exc)}, status=502)

        interaction = InteractionVocale.objects.create(
            utilisateur=request.user,
            audio_question=fichier_audio,
            transcription=resultat['transcription'],
            reponse_texte=resultat['reponse_texte'],
            audio_reponse=resultat['fichier_audio_reponse'],
        )

        return Response(InteractionVocaleSerializer(interaction).data, status=201)


class MesInteractionsVocalesView(generics.ListAPIView):
    """GET /api/ai/chatbot-vocal/historique/ — mes échanges passés avec le chatbot."""

    serializer_class = InteractionVocaleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return InteractionVocale.objects.filter(utilisateur=self.request.user)
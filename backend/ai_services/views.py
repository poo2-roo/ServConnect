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

import base64

from .ameliorer_image_generique import ameliorer_image_bytes
from .legende_publication import generer_legende
from .models import JournalAppelIA


class AmeliorerImageBrouillonView(APIView):
    """POST /api/ai/ameliorer-image/ - ameliore une image pas encore publiee, renvoie du base64."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        fichier = request.FILES.get('image')
        if fichier is None:
            raise ValidationError("Le fichier 'image' est obligatoire.")

        try:
            resultat = ameliorer_image_bytes(fichier.read())
        except Exception as exc:
            return Response({"detail": f"Echec de l'amelioration : {exc}"}, status=502)

        JournalAppelIA.objects.create(
            utilisateur=request.user, module=JournalAppelIA.Module.RETOUCHE_IMAGE,
            modele_utilise='pillow-local', succes=True,
        )

        return Response({"image_base64": base64.b64encode(resultat).decode('ascii')})


class GenererLegendeView(APIView):
    """POST /api/ai/generer-legende/ - genere une legende pour un brouillon de publication."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        type_publication = request.data.get('type_publication', 'actualite')
        notes_brutes = request.data.get('notes_brutes', '')

        try:
            legende = generer_legende(type_publication, notes_brutes, utilisateur=request.user)
        except ErreurAppelIA as exc:
            return Response({"detail": str(exc)}, status=502)

        return Response({"legende": legende})
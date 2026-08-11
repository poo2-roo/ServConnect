from django.db.models import Q
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import get_object_or_404

from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class EstParticipant(permissions.BasePermission):
    """Seuls le client et le prestataire de la conversation peuvent y accéder."""

    def has_object_permission(self, request, view, obj):
        client = getattr(request.user, 'profil_client', None)
        prestataire = getattr(request.user, 'profil_prestataire', None)
        return obj.client == client or obj.prestataire == prestataire


class ConversationListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/messaging/conversations/ — mes conversations (client ou prestataire connecté)
    POST /api/messaging/conversations/ — un client démarre une conversation avec un prestataire
    """

    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(
            Q(client__utilisateur=user) | Q(prestataire__utilisateur=user)
        ).select_related('client__utilisateur', 'prestataire')

    def perform_create(self, serializer):
        client = getattr(self.request.user, 'profil_client', None)
        if client is None:
            raise PermissionDenied("Seul un compte client peut démarrer une conversation.")
        serializer.save(client=client)


class ConversationDetailView(generics.RetrieveAPIView):
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated, EstParticipant]


class MessageListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/messaging/conversations/<id>/messages/ — historique des messages
    POST /api/messaging/conversations/<id>/messages/ — envoyer un message
    """

    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_conversation(self):
        conversation = get_object_or_404(Conversation, pk=self.kwargs['conversation_id'])
        self.check_object_permissions(self.request, conversation)
        return conversation

    def get_queryset(self):
        conversation = self.get_conversation()
        return conversation.messages.select_related('expediteur')

    def perform_create(self, serializer):
        conversation = self.get_conversation()
        serializer.save(conversation=conversation, expediteur=self.request.user)

    def get_permissions(self):
        return [permissions.IsAuthenticated(), EstParticipant()]

from rest_framework.response import Response
from rest_framework.views import APIView

from ai_services.gemini_client import ErreurAppelIA
from ai_services.reponses_auto import suggerer_reponses


class ConversationSuggestionsView(APIView):
    """GET /api/messaging/conversations/<id>/suggestions/ — suggestions de réponse (prestataire)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, conversation_id):
        conversation = get_object_or_404(Conversation, pk=conversation_id)

        prestataire = getattr(request.user, 'profil_prestataire', None)
        if prestataire is None or conversation.prestataire != prestataire:
            raise PermissionDenied("Seul le prestataire de cette conversation peut voir des suggestions.")

        try:
            suggestions = suggerer_reponses(conversation, utilisateur=request.user)
        except ErreurAppelIA as exc:
            return Response({"detail": str(exc)}, status=502)

        return Response({"suggestions": suggestions})
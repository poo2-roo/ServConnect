from django.urls import path

from .views import (
    ConversationDetailView,
    ConversationListCreateView,
    ConversationSuggestionsView,
    MessageListCreateView,
)

urlpatterns = [
    path('conversations/', ConversationListCreateView.as_view(), name='conversation-list-create'),
    path('conversations/<int:pk>/', ConversationDetailView.as_view(), name='conversation-detail'),
    path(
        'conversations/<int:conversation_id>/messages/',
        MessageListCreateView.as_view(),
        name='message-list-create',
    ),
    path(
        'conversations/<int:conversation_id>/suggestions/',
        ConversationSuggestionsView.as_view(),
        name='conversation-suggestions',
    ),
]
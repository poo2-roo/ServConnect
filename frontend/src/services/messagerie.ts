import api from './api';
import { Conversation, Message } from '../types';

export async function creerConversation(prestataireId: number): Promise<Conversation> {
  const reponse = await api.post<Conversation>('/api/messaging/conversations/', { prestataire: prestataireId });
  return reponse.data;
}

export async function recupererMessages(conversationId: number): Promise<Message[]> {
  const reponse = await api.get<{ results?: Message[] } | Message[]>(
    `/api/messaging/conversations/${conversationId}/messages/`
  );
  return Array.isArray(reponse.data) ? reponse.data : reponse.data.results || [];
}

export async function envoyerMessage(conversationId: number, contenu: string): Promise<Message> {
  const reponse = await api.post<Message>(`/api/messaging/conversations/${conversationId}/messages/`, { contenu });
  return reponse.data;
}

export interface SuggestionReponse {
  ton: string;
  texte: string;
}

export async function recupererSuggestions(conversationId: number): Promise<SuggestionReponse[]> {
  const reponse = await api.get<{ suggestions: SuggestionReponse[] }>(
    `/api/messaging/conversations/${conversationId}/suggestions/`
  );
  return reponse.data.suggestions;
}

export async function recupererMessagesAdmin(conversationId: number) {
  const r = await api.get(`/api/messaging/admin-conversations/${conversationId}/messages/`);
  return Array.isArray(r.data) ? r.data : r.data.results || [];
}

export async function envoyerMessageAdmin(conversationId: number, contenu: string) {
  const r = await api.post(`/api/messaging/admin-conversations/${conversationId}/messages/`, { contenu });
  return r.data;
}
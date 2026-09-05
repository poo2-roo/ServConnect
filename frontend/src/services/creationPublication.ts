import api from './api';

export async function ameliorerImageBrouillon(uriImage: string): Promise<string> {
  const formData = new FormData();
  formData.append('image', {
    uri: uriImage,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as any);

  const reponse = await api.post<{ image_base64: string }>('/api/ai/ameliorer-image/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return `data:image/jpeg;base64,${reponse.data.image_base64}`;
}

export async function genererLegende(typePublication: string, notesBrutes: string): Promise<string> {
  const reponse = await api.post<{ legende: string }>('/api/ai/generer-legende/', {
    type_publication: typePublication,
    notes_brutes: notesBrutes,
  });
  return reponse.data.legende;
}

export async function publier(donnees: {
  type_publication: string;
  contenu: string;
  imageUri?: string;
}): Promise<void> {
  const formData = new FormData();
  formData.append('type_publication', donnees.type_publication);
  formData.append('contenu', donnees.contenu);
  if (donnees.imageUri) {
    formData.append('image', {
      uri: donnees.imageUri,
      name: 'publication.jpg',
      type: 'image/jpeg',
    } as any);
  }

  await api.post('/api/publications/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
from django.db import migrations, models


def fusionner_conversations(apps, schema_editor):
    Conversation = apps.get_model('messaging', 'Conversation')
    Message = apps.get_model('messaging', 'Message')

    conversations = Conversation.objects.order_by('client_id', 'prestataire_id', 'date_creation', 'id')
    conversation_principale = {}

    for conversation in conversations:
        cle = (conversation.client_id, conversation.prestataire_id)
        principale = conversation_principale.get(cle)
        if principale is None:
            conversation_principale[cle] = conversation
            continue

        Message.objects.filter(conversation_id=conversation.id).update(conversation_id=principale.id)
        if conversation.derniere_activite > principale.derniere_activite:
            principale.derniere_activite = conversation.derniere_activite
            principale.save(update_fields=['derniere_activite'])
        conversation.delete()


def annuler_fusion(apps, schema_editor):
    # Les doublons fusionnes ne peuvent pas etre reconstruits automatiquement.
    pass


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ('messaging', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(fusionner_conversations, annuler_fusion),
        migrations.AddConstraint(
            model_name='conversation',
            constraint=models.UniqueConstraint(
                fields=['client', 'prestataire'],
                name='unique_conversation_client_prestataire',
            ),
        ),
    ]

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0001_initial'),
        ('messaging', '0002_fusionner_conversations_uniques'),
    ]

    operations = [
        migrations.AlterField(
            model_name='conversation',
            name='client',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='conversations',
                to='accounts.client',
            ),
        ),
        migrations.AddField(
            model_name='conversation',
            name='prestataire_initiateur',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='conversations_initiees',
                to='accounts.prestataire',
            ),
        ),
        migrations.AddConstraint(
            model_name='conversation',
            constraint=models.UniqueConstraint(
                condition=models.Q(client__isnull=True, prestataire_initiateur__isnull=False),
                fields=('prestataire_initiateur', 'prestataire'),
                name='unique_conversation_prestataires',
            ),
        ),
    ]

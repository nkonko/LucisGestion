import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FirestoreService } from '../../core/services/firestore.service';
import { DialogService } from '../../core/services/dialog.service';
import { NotificationService } from '../../core/services/notification.service';
import { ConfirmDialogComponent } from '../../shared/ui-modal/confirm-dialog.component';
import { UiIconComponent } from '../../shared/ui/components';
import { AppBackupFile } from '../../core/models/backup';
import { AuthStore } from '../../core/store/auth.store';

@Component({
  selector: 'app-backup-restore',
  imports: [UiIconComponent],
  templateUrl: './backup-restore.component.html',
  styleUrl: './backup-restore.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackupRestoreComponent {
  private firestoreService = inject(FirestoreService);
  private dialogService = inject(DialogService);
  private notificationService = inject(NotificationService);
  readonly auth = inject(AuthStore);

  readonly backupProgress = signal(0);
  readonly restoreProgress = signal(0);
  readonly backupInProgress = signal(false);
  readonly restoreInProgress = signal(false);
  readonly backupFileName = signal<string | null>(null);
  readonly restoreFileName = signal<string | null>(null);
  readonly backupDownloadUrl = signal<string | null>(null);
  readonly selectedBackup = signal<AppBackupFile | null>(null);

  readonly canDownload = computed(
    () => this.backupDownloadUrl() !== null && !this.backupInProgress(),
  );
  readonly canRestore = computed(() => this.selectedBackup() !== null && !this.restoreInProgress());

  async createBackup(): Promise<void> {
    if (!this.auth.isOwner()) {
      this.notificationService.error('Solo la dueña puede generar backups.');
      return;
    }

    const confirmed = await this.confirmAction(
      'Crear backup',
      'Se va a leer el estado actual de todas las colecciones y preparar un archivo descargable. ¿Querés continuar?',
      'Crear backup',
    );

    if (!confirmed) return;

    this.backupInProgress.set(true);
    this.backupProgress.set(0);
    this.clearDownloadUrl();

    try {
      const backup = await this.firestoreService.createBackup((progress) =>
        this.backupProgress.set(progress),
      );
      const fileName = this.buildFileName(backup.generatedAt);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      this.backupFileName.set(fileName);
      this.backupDownloadUrl.set(url);
      this.backupProgress.set(100);
      this.notificationService.success('Backup listo para descargar');
    } catch (error) {
      this.backupProgress.set(0);
      this.notificationService.error(this.getErrorMessage(error, 'No se pudo crear el backup'));
    } finally {
      this.backupInProgress.set(false);
    }
  }

  downloadBackup(): void {
    const url = this.backupDownloadUrl();
    const fileName = this.backupFileName();
    if (!url || !fileName) return;

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = this.firestoreService.parseBackupJson(text);
      this.selectedBackup.set(parsed);
      this.restoreFileName.set(file.name);
      this.restoreProgress.set(0);
      this.notificationService.success('Archivo de backup cargado');
    } catch (error) {
      this.selectedBackup.set(null);
      this.restoreFileName.set(null);
      this.notificationService.error(this.getErrorMessage(error, 'El archivo seleccionado no es válido'));
    } finally {
      input.value = '';
    }
  }

  async restoreBackup(): Promise<void> {
    if (!this.auth.isOwner()) {
      this.notificationService.error('Solo la dueña puede restaurar backups.');
      return;
    }

    const backup = this.selectedBackup();
    if (!backup) return;

    const confirmed = await this.confirmAction(
      'Restaurar backup',
      'Esta acción va a reemplazar todas las colecciones por el contenido del archivo seleccionado. No se puede deshacer desde la app. ¿Estás seguro?',
      'Restaurar',
      true,
    );

    if (!confirmed) return;

    this.restoreInProgress.set(true);
    this.restoreProgress.set(0);

    try {
      await this.firestoreService.restoreBackup(backup, (progress) =>
        this.restoreProgress.set(progress),
      );
      this.restoreProgress.set(100);
      this.notificationService.success('Restore completado');
    } catch (error) {
      this.notificationService.error(this.getErrorMessage(error, 'No se pudo restaurar el backup'));
    } finally {
      this.restoreInProgress.set(false);
    }
  }

  private async confirmAction(
    title: string,
    message: string,
    confirmLabel: string,
    destructive = false,
  ): Promise<boolean> {
    const dialogRef = this.dialogService.open<unknown, boolean>(ConfirmDialogComponent, {
      data: {
        title,
        message,
        confirmLabel,
        cancelLabel: 'Cancelar',
        destructive,
      },
    });
    return (await firstValueFrom(dialogRef.afterClosed)) === true;
  }

  private buildFileName(generatedAt: string): string {
    return `lucis-gestion-backup-${generatedAt.replace(/[:.]/g, '-')}.json`;
  }

  private clearDownloadUrl(): void {
    const previousUrl = this.backupDownloadUrl();
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
    }
    this.backupDownloadUrl.set(null);
    this.backupFileName.set(null);
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
  }
}

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { BackupRestoreComponent } from './backup-restore.component';
import { FirestoreService } from '../../core/services/firestore.service';
import { BottomSheetService } from '../../core/services/bottom-sheet.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthStore } from '../../core/store/auth.store';
import type { AppBackupFile } from '../../core/models/backup';

const createBackupPayload = (): AppBackupFile => ({
  schema: 'lucis-gestion-backup',
  version: 1,
  generatedAt: '2026-06-08T15:00:00.000Z',
  collections: {
    users: [],
    ingredients: [],
    recipes: [],
    customers: [],
    sales: [],
    priceHistory: [],
    stockMovements: [],
    supplyExpenses: [],
    fixedCostsByMonth: [],
  },
});

describe('BackupRestoreComponent', () => {
  let fixture: ComponentFixture<BackupRestoreComponent>;
  let component: BackupRestoreComponent;

  let firestoreMock: {
    createBackup: ReturnType<typeof vi.fn>;
    restoreBackup: ReturnType<typeof vi.fn>;
    parseBackupJson: ReturnType<typeof vi.fn>;
  };
  let bottomSheetMock: { open: ReturnType<typeof vi.fn> };
  let notificationMock: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let authMock: { isOwner: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    firestoreMock = {
      createBackup: vi.fn().mockResolvedValue(createBackupPayload()),
      restoreBackup: vi.fn().mockResolvedValue(undefined),
      parseBackupJson: vi.fn().mockReturnValue(createBackupPayload()),
    };

    bottomSheetMock = {
      open: vi.fn().mockReturnValue({ afterClosed: of(true) }),
    };

    notificationMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    authMock = {
      isOwner: vi.fn().mockReturnValue(true),
    };

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:backup-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [BackupRestoreComponent],
      providers: [
        { provide: FirestoreService, useValue: firestoreMock },
        { provide: BottomSheetService, useValue: bottomSheetMock },
        { provide: NotificationService, useValue: notificationMock },
        { provide: AuthStore, useValue: authMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BackupRestoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('blocks backup creation for non-owner users', async () => {
    authMock.isOwner.mockReturnValue(false);

    await component.createBackup();

    expect(firestoreMock.createBackup).not.toHaveBeenCalled();
    expect(notificationMock.error).toHaveBeenCalledWith('Solo la dueña puede generar backups.');
  });

  it('creates backup for owner user and exposes a download URL', async () => {
    await component.createBackup();

    expect(bottomSheetMock.open).toHaveBeenCalledTimes(1);
    expect(firestoreMock.createBackup).toHaveBeenCalledTimes(1);
    expect(component.backupDownloadUrl()).toBe('blob:backup-url');
    expect(component.backupFileName()).toContain('lucis-gestion-backup-');
    expect(notificationMock.success).toHaveBeenCalledWith('Backup listo para descargar');
  });

  it('loads and validates selected backup file', async () => {
    const payload = createBackupPayload();
    firestoreMock.parseBackupJson.mockReturnValue(payload);

    const htmlInputElementMock = {
      files: [{ name: 'backup.json', text: () => Promise.resolve('{"ok":true}') }],
      value: 'filled',
    } as unknown as HTMLInputElement;

    await component.onFileSelected({ target: htmlInputElementMock } as unknown as Event);

    expect(firestoreMock.parseBackupJson).toHaveBeenCalledWith('{"ok":true}');
    expect(component.selectedBackup()).toEqual(payload);
    expect(component.restoreFileName()).toBe('backup.json');
    expect(htmlInputElementMock.value).toBe('');
    expect(notificationMock.success).toHaveBeenCalledWith('Archivo de backup cargado');
  });

  it('shows validation error when selected backup file is invalid', async () => {
    firestoreMock.parseBackupJson.mockImplementation(() => {
      throw new Error('Formato inválido');
    });

    const htmlInputElementMock = {
      files: [{ name: 'bad.json', text: () => Promise.resolve('invalid') }],
      value: 'filled',
    } as unknown as HTMLInputElement;

    await component.onFileSelected({ target: htmlInputElementMock } as unknown as Event);

    expect(component.selectedBackup()).toBeNull();
    expect(component.restoreFileName()).toBeNull();
    expect(notificationMock.error).toHaveBeenCalledWith('Formato inválido');
  });

  it('blocks restore execution for non-owner users', async () => {
    authMock.isOwner.mockReturnValue(false);
    component.selectedBackup.set(createBackupPayload());

    await component.restoreBackup();

    expect(firestoreMock.restoreBackup).not.toHaveBeenCalled();
    expect(notificationMock.error).toHaveBeenCalledWith('Solo la dueña puede restaurar backups.');
  });

  it('restores data for owner user after confirmation', async () => {
    component.selectedBackup.set(createBackupPayload());

    await component.restoreBackup();

    expect(bottomSheetMock.open).toHaveBeenCalledTimes(1);
    expect(firestoreMock.restoreBackup).toHaveBeenCalledTimes(1);
    expect(notificationMock.success).toHaveBeenCalledWith('Restore completado');
  });
});

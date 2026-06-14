import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { DemoModeService } from './demo-mode.service';
import { Observable } from 'rxjs';
import type { QueryConstraint } from '@angular/fire/firestore';
import type { AppBackupFile, BackupProgressCallback } from '../models/backup';

/**
 * Servicio que envuelve FirestoreService para bloquear escrituras en modo demo
 * Las lecturas funcionan normalmente, pero los cambios se ignoran
 */
@Injectable({ providedIn: 'root' })
export class DemoAwareFirestoreService extends FirestoreService {
  private demoMode = inject(DemoModeService);

  override async addDocument<T extends object>(collectionPath: string, data: T): Promise<string> {
    if (this.demoMode.isDemoMode()) {
      console.log('📝 Modo Demo: No se guardarán cambios en Firebase', { collectionPath, data });
      // Retornar un ID simulado
      return `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    return super.addDocument(collectionPath, data);
  }

  override async updateDocument(
    collectionPath: string,
    docId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (this.demoMode.isDemoMode()) {
      console.log('✏️ Modo Demo: No se guardarán cambios en Firebase', {
        collectionPath,
        docId,
        data,
      });
      return;
    }
    return super.updateDocument(collectionPath, docId, data);
  }

  override async deleteDocument(collectionPath: string, docId: string): Promise<void> {
    if (this.demoMode.isDemoMode()) {
      console.log('🗑️ Modo Demo: No se guardarán cambios en Firebase', { collectionPath, docId });
      return;
    }
    return super.deleteDocument(collectionPath, docId);
  }

  override async createBackup(onProgress?: BackupProgressCallback): Promise<AppBackupFile> {
    if (this.demoMode.isDemoMode()) {
      onProgress?.(100);
      return {
        schema: 'lucis-gestion-backup',
        version: 1,
        generatedAt: new Date().toISOString(),
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
      };
    }
    return super.createBackup(onProgress);
  }

  override async restoreBackup(
    backup: AppBackupFile,
    onProgress?: BackupProgressCallback,
  ): Promise<void> {
    if (this.demoMode.isDemoMode()) {
      console.log('📥 Modo Demo: No se restaurará backup en Firebase');
      onProgress?.(100);
      return;
    }
    return super.restoreBackup(backup, onProgress);
  }

  // Las operaciones de lectura funcionan normalmente
  override getCollection<T extends { id?: string }>(
    path: string,
    ...constraints: QueryConstraint[]
  ): Observable<T[]> {
    return super.getCollection(path, ...constraints);
  }
}

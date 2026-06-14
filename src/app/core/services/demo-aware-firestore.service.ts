import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { DemoModeService } from './demo-mode.service';
import { MockFirestoreService } from './mock-firestore.service';
import { Observable } from 'rxjs';
import type { QueryConstraint } from '@angular/fire/firestore';
import type { AppBackupFile, BackupProgressCallback } from '../models/backup';
import type { StockAdjustmentInput, SupplyPurchaseAtomicInput } from '../models/stock';

/**
 * Servicio que envuelve FirestoreService para bloquear escrituras en modo demo
 * Las lecturas funcionan normalmente, pero los cambios se ignoran
 */
@Injectable({ providedIn: 'root' })
export class DemoAwareFirestoreService extends FirestoreService {
  private demoMode = inject(DemoModeService);
  private mockFirestore = inject(MockFirestoreService);

  override async addDocument<T extends object>(collectionPath: string, data: T): Promise<string> {
    if (this.demoMode.isDemoMode()) {
      return this.mockFirestore.addDocument(collectionPath, data as Record<string, unknown>);
    }
    return super.addDocument(collectionPath, data);
  }

  override async updateDocument(
    collectionPath: string,
    docId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    if (this.demoMode.isDemoMode()) {
      return this.mockFirestore.updateDocument(collectionPath, docId, data);
    }
    return super.updateDocument(collectionPath, docId, data);
  }

  override async deleteDocument(collectionPath: string, docId: string): Promise<void> {
    if (this.demoMode.isDemoMode()) {
      return this.mockFirestore.deleteDocument(collectionPath, docId);
    }
    return super.deleteDocument(collectionPath, docId);
  }

  override async clearCustomerReferencesInSales(customerId: string): Promise<void> {
    if (this.demoMode.isDemoMode()) {
      return this.mockFirestore.clearCustomerReferencesInSales(customerId);
    }
    return super.clearCustomerReferencesInSales(customerId);
  }

  override async softDelete(path: string, id: string): Promise<void> {
    if (this.demoMode.isDemoMode()) {
      return this.mockFirestore.softDelete(path, id);
    }
    return super.softDelete(path, id);
  }

  override createDocumentId(path: string): string {
    if (this.demoMode.isDemoMode()) {
      return this.mockFirestore.createDocumentId(path);
    }
    return super.createDocumentId(path);
  }

  override async registerSupplyPurchaseAtomic(
    input: SupplyPurchaseAtomicInput,
  ): Promise<{ expenseId: string; alreadyApplied: boolean }> {
    if (this.demoMode.isDemoMode()) {
      return this.mockFirestore.registerSupplyPurchaseAtomic(input);
    }
    return super.registerSupplyPurchaseAtomic(input);
  }

  override async applyStockAdjustments(
    saleId: string,
    movementType: 'sale_deduction' | 'cancellation_restock' | 'edit_restock' | 'edit_deduction',
    adjustments: StockAdjustmentInput[],
  ): Promise<void> {
    if (this.demoMode.isDemoMode()) {
      return this.mockFirestore.applyStockAdjustments(saleId, movementType, adjustments);
    }
    return super.applyStockAdjustments(saleId, movementType, adjustments);
  }

  override parseBackupJson(content: string): AppBackupFile {
    if (this.demoMode.isDemoMode()) {
      return this.mockFirestore.parseBackupJson(content);
    }
    return super.parseBackupJson(content);
  }

  override async createBackup(onProgress?: BackupProgressCallback): Promise<AppBackupFile> {
    if (this.demoMode.isDemoMode()) {
      return this.mockFirestore.createBackup(onProgress);
    }
    return super.createBackup(onProgress);
  }

  override async restoreBackup(
    backup: AppBackupFile,
    onProgress?: BackupProgressCallback,
  ): Promise<void> {
    if (this.demoMode.isDemoMode()) {
      return this.mockFirestore.restoreBackup(backup, onProgress);
    }
    return super.restoreBackup(backup, onProgress);
  }

  override getCollection<T extends { id?: string }>(
    path: string,
    ...constraints: QueryConstraint[]
  ): Observable<T[]> {
    if (this.demoMode.isDemoMode()) {
      return this.mockFirestore.getCollection<T>(path, ...constraints);
    }
    return super.getCollection(path, ...constraints);
  }
}

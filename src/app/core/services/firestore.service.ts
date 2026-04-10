import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  query,
  CollectionReference,
  QueryConstraint,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private firestore = inject(Firestore);

  getCollection<T>(path: string, ...constraints: QueryConstraint[]): Observable<T[]> {
    const ref = collection(this.firestore, path) as CollectionReference<T>;
    const q = constraints.length > 0 ? query(ref, ...constraints) : ref;
    return collectionData(q, { idField: 'id' as any }) as Observable<T[]>;
  }

  async addDocument<T extends Record<string, any>>(path: string, data: T): Promise<string> {
    const ref = collection(this.firestore, path);
    const { id, ...dataWithoutId } = data;
    const docRef = await addDoc(ref, dataWithoutId);
    return docRef.id;
  }

  async updateDocument(path: string, id: string, data: Record<string, any>): Promise<void> {
    const ref = doc(this.firestore, path, id);
    const { id: _, ...dataWithoutId } = data;
    await updateDoc(ref, dataWithoutId);
  }

  async softDelete(path: string, id: string): Promise<void> {
    await this.updateDocument(path, id, { activo: false });
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Timestamp } from 'firebase/firestore';
import type {
  Ingrediente,
  Receta,
  Venta,
  Cliente,
} from '../models';

@Injectable()
export class MockFirestoreService {
  private collections = new Map<string, BehaviorSubject<unknown[]>>();

  constructor() {
    this.seed();
  }

  getCollection<T>(path: string, ..._constraints: unknown[]): Observable<T[]> {
    return this.getOrCreate(path).asObservable() as Observable<T[]>;
  }

  async addDocument<T extends Record<string, unknown>>(path: string, data: T): Promise<string> {
    const col = this.getOrCreate(path);
    const id = 'mock-' + crypto.randomUUID().slice(0, 8);
    const { id: _, ...rest } = data;
    col.next([...col.value, { id, ...rest }]);
    return id;
  }

  async updateDocument(path: string, id: string, data: Record<string, unknown>): Promise<void> {
    const col = this.getOrCreate(path);
    col.next(col.value.map((item: any) => (item.id === id ? { ...item, ...data } : item)));
  }

  async softDelete(path: string, id: string): Promise<void> {
    const col = this.getOrCreate(path);
    col.next(col.value.filter((item: any) => item.id !== id));
  }

  private getOrCreate(path: string): BehaviorSubject<unknown[]> {
    if (!this.collections.has(path)) {
      this.collections.set(path, new BehaviorSubject<unknown[]>([]));
    }
    return this.collections.get(path)!;
  }

  // ---------------------------------------------------------------------------
  // Seed data
  // ---------------------------------------------------------------------------
  private seed(): void {
    const ts = (y: number, m: number, d: number) => Timestamp.fromDate(new Date(y, m - 1, d));

    // --- Ingredientes (sorted by nombre asc) ---------------------------------
    const ingredientes: Ingrediente[] = [
      { id: 'ing-1', nombre: 'Azúcar', unidad: 'kg', precioUnitario: 600, stockActual: 10, stockMinimo: 3, categoria: 'azucares', ultimaCompra: ts(2026, 3, 25), activo: true },
      { id: 'ing-2', nombre: 'Cacao amargo', unidad: 'kg', precioUnitario: 5200, stockActual: 1.5, stockMinimo: 1, categoria: 'secos', ultimaCompra: ts(2026, 3, 20), activo: true },
      { id: 'ing-3', nombre: 'Chocolate cobertura', unidad: 'kg', precioUnitario: 7500, stockActual: 0.8, stockMinimo: 1, categoria: 'decoracion', ultimaCompra: ts(2026, 3, 10), activo: true },
      { id: 'ing-4', nombre: 'Crema de leche', unidad: 'lt', precioUnitario: 2800, stockActual: 4, stockMinimo: 2, categoria: 'lacteos', ultimaCompra: ts(2026, 3, 28), activo: true },
      { id: 'ing-5', nombre: 'Dulce de leche', unidad: 'kg', precioUnitario: 3200, stockActual: 2, stockMinimo: 1, categoria: 'lacteos', ultimaCompra: ts(2026, 3, 22), activo: true },
      { id: 'ing-6', nombre: 'Esencia de vainilla', unidad: 'ml', precioUnitario: 15, stockActual: 200, stockMinimo: 50, categoria: 'otros', ultimaCompra: ts(2026, 3, 15), activo: true },
      { id: 'ing-7', nombre: 'Harina 0000', unidad: 'kg', precioUnitario: 800, stockActual: 15, stockMinimo: 5, categoria: 'secos', ultimaCompra: ts(2026, 3, 30), activo: true },
      { id: 'ing-8', nombre: 'Huevos', unidad: 'unidad', precioUnitario: 150, stockActual: 48, stockMinimo: 12, categoria: 'huevos', ultimaCompra: ts(2026, 4, 1), activo: true },
      { id: 'ing-9', nombre: 'Leche', unidad: 'lt', precioUnitario: 900, stockActual: 8, stockMinimo: 4, categoria: 'lacteos', ultimaCompra: ts(2026, 3, 29), activo: true },
      { id: 'ing-10', nombre: 'Manteca', unidad: 'kg', precioUnitario: 3500, stockActual: 3, stockMinimo: 2, categoria: 'grasas', ultimaCompra: ts(2026, 3, 27), activo: true },
    ];

    // --- Recetas (sorted by nombre asc) --------------------------------------
    const recetas: Receta[] = [
      {
        id: 'rec-1',
        nombre: 'Alfajores de Maicena (x12)',
        categoria: 'galletas',
        ingredientes: [
          { ingredienteId: 'ing-7', nombre: 'Harina 0000', cantidad: 0.3, unidad: 'kg', costoLinea: 240 },
          { ingredienteId: 'ing-1', nombre: 'Azúcar', cantidad: 0.15, unidad: 'kg', costoLinea: 90 },
          { ingredienteId: 'ing-10', nombre: 'Manteca', cantidad: 0.2, unidad: 'kg', costoLinea: 700 },
          { ingredienteId: 'ing-8', nombre: 'Huevos', cantidad: 2, unidad: 'unidad', costoLinea: 300 },
          { ingredienteId: 'ing-6', nombre: 'Esencia de vainilla', cantidad: 10, unidad: 'ml', costoLinea: 150 },
          { ingredienteId: 'ing-5', nombre: 'Dulce de leche', cantidad: 0.4, unidad: 'kg', costoLinea: 1280 },
        ],
        costoCalculado: 2760,
        margenGanancia: 70,
        precioSugerido: 4692,
        precioVenta: 4500,
        rendimiento: 12,
        notas: 'Clásicos argentinos',
        imagenUrl: '',
        activo: true,
      },
      {
        id: 'rec-2',
        nombre: 'Budín de Limón',
        categoria: 'panes',
        ingredientes: [
          { ingredienteId: 'ing-7', nombre: 'Harina 0000', cantidad: 0.25, unidad: 'kg', costoLinea: 200 },
          { ingredienteId: 'ing-1', nombre: 'Azúcar', cantidad: 0.2, unidad: 'kg', costoLinea: 120 },
          { ingredienteId: 'ing-8', nombre: 'Huevos', cantidad: 3, unidad: 'unidad', costoLinea: 450 },
          { ingredienteId: 'ing-10', nombre: 'Manteca', cantidad: 0.12, unidad: 'kg', costoLinea: 420 },
          { ingredienteId: 'ing-9', nombre: 'Leche', cantidad: 0.15, unidad: 'lt', costoLinea: 135 },
          { ingredienteId: 'ing-6', nombre: 'Esencia de vainilla', cantidad: 5, unidad: 'ml', costoLinea: 75 },
        ],
        costoCalculado: 1400,
        margenGanancia: 80,
        precioSugerido: 2520,
        precioVenta: 2500,
        rendimiento: 8,
        notas: 'Con glasé de limón',
        imagenUrl: '',
        activo: true,
      },
      {
        id: 'rec-3',
        nombre: 'Cheesecake',
        categoria: 'tartas',
        ingredientes: [
          { ingredienteId: 'ing-7', nombre: 'Harina 0000', cantidad: 0.15, unidad: 'kg', costoLinea: 120 },
          { ingredienteId: 'ing-1', nombre: 'Azúcar', cantidad: 0.2, unidad: 'kg', costoLinea: 120 },
          { ingredienteId: 'ing-10', nombre: 'Manteca', cantidad: 0.15, unidad: 'kg', costoLinea: 525 },
          { ingredienteId: 'ing-8', nombre: 'Huevos', cantidad: 4, unidad: 'unidad', costoLinea: 600 },
          { ingredienteId: 'ing-4', nombre: 'Crema de leche', cantidad: 0.5, unidad: 'lt', costoLinea: 1400 },
          { ingredienteId: 'ing-5', nombre: 'Dulce de leche', cantidad: 0.3, unidad: 'kg', costoLinea: 960 },
        ],
        costoCalculado: 3725,
        margenGanancia: 65,
        precioSugerido: 6147,
        precioVenta: 6500,
        rendimiento: 10,
        notas: 'Base de galletitas',
        imagenUrl: '',
        activo: true,
      },
      {
        id: 'rec-4',
        nombre: 'Torta de Chocolate',
        categoria: 'tortas',
        ingredientes: [
          { ingredienteId: 'ing-7', nombre: 'Harina 0000', cantidad: 0.4, unidad: 'kg', costoLinea: 320 },
          { ingredienteId: 'ing-1', nombre: 'Azúcar', cantidad: 0.3, unidad: 'kg', costoLinea: 180 },
          { ingredienteId: 'ing-8', nombre: 'Huevos', cantidad: 6, unidad: 'unidad', costoLinea: 900 },
          { ingredienteId: 'ing-10', nombre: 'Manteca', cantidad: 0.25, unidad: 'kg', costoLinea: 875 },
          { ingredienteId: 'ing-2', nombre: 'Cacao amargo', cantidad: 0.15, unidad: 'kg', costoLinea: 780 },
          { ingredienteId: 'ing-9', nombre: 'Leche', cantidad: 0.3, unidad: 'lt', costoLinea: 270 },
          { ingredienteId: 'ing-4', nombre: 'Crema de leche', cantidad: 0.5, unidad: 'lt', costoLinea: 1400 },
        ],
        costoCalculado: 4725,
        margenGanancia: 60,
        precioSugerido: 7560,
        precioVenta: 7500,
        rendimiento: 12,
        notas: 'La más pedida',
        imagenUrl: '',
        activo: true,
      },
    ];

    // --- Clientes (sorted by nombre asc) -------------------------------------
    const clientes: Cliente[] = [
      { id: 'cli-1', nombre: 'Ana Martínez', telefono: '1162345678', direccion: 'Av. Alvear 1800, Recoleta', notas: 'Siempre pide budín para eventos', totalCompras: 1, ultimaCompra: ts(2026, 4, 5) },
      { id: 'cli-2', nombre: 'Carlos Rodríguez', telefono: '1148765432', direccion: 'Av. Cabildo 1500, Belgrano', notas: '', totalCompras: 1, ultimaCompra: ts(2026, 4, 7) },
      { id: 'cli-3', nombre: 'Lucía Fernández', telefono: '1171234567', direccion: 'Av. Rivadavia 5400, Caballito', notas: 'Pedidos para oficina', totalCompras: 1, ultimaCompra: ts(2026, 4, 10) },
      { id: 'cli-4', nombre: 'María López', telefono: '1155234567', direccion: 'Av. Santa Fe 3200, Palermo', notas: 'Clienta frecuente, prefiere chocolate', totalCompras: 1, ultimaCompra: ts(2026, 4, 9) },
    ];

    // --- Ventas (sorted by fecha desc) ---------------------------------------
    const ventas: Venta[] = [
      {
        id: 'ven-1',
        fecha: ts(2026, 4, 10),
        clienteId: 'cli-3',
        clienteNombre: 'Lucía Fernández',
        items: [
          { recetaId: 'rec-3', nombre: 'Cheesecake', cantidad: 1, precioUnitario: 6500, costoUnitario: 3725 },
          { recetaId: 'rec-1', nombre: 'Alfajores de Maicena (x12)', cantidad: 2, precioUnitario: 4500, costoUnitario: 2760 },
        ],
        total: 15500,
        costoTotal: 9245,
        ganancia: 6255,
        medioPago: 'transferencia',
        estado: 'pendiente',
        notas: 'Entregar a las 17hs',
      },
      {
        id: 'ven-2',
        fecha: ts(2026, 4, 9),
        clienteId: 'cli-4',
        clienteNombre: 'María López',
        items: [
          { recetaId: 'rec-4', nombre: 'Torta de Chocolate', cantidad: 1, precioUnitario: 7500, costoUnitario: 4725 },
          { recetaId: 'rec-1', nombre: 'Alfajores de Maicena (x12)', cantidad: 1, precioUnitario: 4500, costoUnitario: 2760 },
        ],
        total: 12000,
        costoTotal: 7485,
        ganancia: 4515,
        medioPago: 'transferencia',
        estado: 'entregado',
        notas: '',
      },
      {
        id: 'ven-3',
        fecha: ts(2026, 4, 7),
        clienteId: 'cli-2',
        clienteNombre: 'Carlos Rodríguez',
        items: [
          { recetaId: 'rec-3', nombre: 'Cheesecake', cantidad: 1, precioUnitario: 6500, costoUnitario: 3725 },
        ],
        total: 6500,
        costoTotal: 3725,
        ganancia: 2775,
        medioPago: 'efectivo',
        estado: 'entregado',
        notas: '',
      },
      {
        id: 'ven-4',
        fecha: ts(2026, 4, 5),
        clienteId: 'cli-1',
        clienteNombre: 'Ana Martínez',
        items: [
          { recetaId: 'rec-2', nombre: 'Budín de Limón', cantidad: 2, precioUnitario: 2500, costoUnitario: 1400 },
          { recetaId: 'rec-4', nombre: 'Torta de Chocolate', cantidad: 1, precioUnitario: 7500, costoUnitario: 4725 },
        ],
        total: 12500,
        costoTotal: 7525,
        ganancia: 4975,
        medioPago: 'mercadopago',
        estado: 'entregado',
        notas: 'Para cumpleaños',
      },
      {
        id: 'ven-5',
        fecha: ts(2026, 4, 3),
        clienteId: null,
        clienteNombre: 'Consumidor final',
        items: [
          { recetaId: 'rec-2', nombre: 'Budín de Limón', cantidad: 3, precioUnitario: 2500, costoUnitario: 1400 },
        ],
        total: 7500,
        costoTotal: 4200,
        ganancia: 3300,
        medioPago: 'efectivo',
        estado: 'entregado',
        notas: '',
      },
    ];

    this.getOrCreate('ingredientes').next(ingredientes);
    this.getOrCreate('recetas').next(recetas);
    this.getOrCreate('clientes').next(clientes);
    this.getOrCreate('ventas').next(ventas);
    this.getOrCreate('historialPrecios').next([]);
    this.getOrCreate('movimientosStock').next([]);
    this.getOrCreate('gastosInsumos').next([]);
  }
}

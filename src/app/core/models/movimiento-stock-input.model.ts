import { MovimientoStock } from './movimiento-stock.model';

export type MovimientoStockInput = Omit<MovimientoStock, 'id'>;

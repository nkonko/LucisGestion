import { Ingrediente } from './ingrediente-base.model';

export type IngredienteInput = Omit<Ingrediente, 'id'>;
export type IngredienteInputForm = Omit<Ingrediente, 'id' | 'ultimaCompra' | 'activo'>;

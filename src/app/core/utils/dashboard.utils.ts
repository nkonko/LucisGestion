import { Periodo } from '../models/periodo.model';

export function obtenerInicioPeriodo(_periodo: Periodo): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

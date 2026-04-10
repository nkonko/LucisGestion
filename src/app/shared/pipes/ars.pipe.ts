import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'ars', standalone: true })
export class ArsPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '$0';
    return '$' + value.toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
}

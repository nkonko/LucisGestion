import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  /**
   * Normaliza un teléfono argentino al formato internacional para WhatsApp.
   * - 10 dígitos (celular sin código país) → agrega 549
   * - 11 dígitos empezando con 15 → quita 15 y agrega 549
   */
  normalizarTelefono(tel: string): string {
    let digits = tel.replace(/\D/g, '');
    if (digits.length === 10) digits = '549' + digits;
    else if (digits.length === 11 && digits.startsWith('15')) digits = '549' + digits.slice(2);
    return digits;
  }

  /** Abre WhatsApp Web con un mensaje pre-armado */
  enviarMensaje(telefono: string, mensaje: string): void {
    const tel = this.normalizarTelefono(telefono);
    const encoded = encodeURIComponent(mensaje);
    window.open(`https://wa.me/${tel}?text=${encoded}`, '_blank');
  }
}

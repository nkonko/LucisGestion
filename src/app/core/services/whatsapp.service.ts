import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  /**
   * Normalizes an Argentine phone number to international format for WhatsApp.
   * - 10 digits (mobile without country code) → prepends 549
   * - 11 digits starting with 15 → removes 15 and prepends 549
   */
  normalizePhone(tel: string): string {
    let digits = tel.replace(/\D/g, '');
    if (digits.length === 10) digits = '549' + digits;
    else if (digits.length === 11 && digits.startsWith('15')) digits = '549' + digits.slice(2);
    return digits;
  }

  /** Opens WhatsApp Web with a pre-composed message */
  sendMessage(phone: string, message: string): void {
    const tel = this.normalizePhone(phone);
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${tel}?text=${encoded}`, '_blank');
  }
}

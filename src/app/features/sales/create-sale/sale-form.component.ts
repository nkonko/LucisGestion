import { ChangeDetectionStrategy, Component, inject, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Sale, SaleInput } from '../../../core/models/sale';
import { Timestamp } from '@angular/fire/firestore';
import { DIALOG_REF, DIALOG_DATA } from '../../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../../core/models/dialog/dialog-ref.model';
import { CustomerSearchComponent } from './customer-search/customer-search.component';
import { SaleProductItemComponent } from './product-item/sale-product-item.component';
import { SaleFormService } from './sale-form.service';

@Component({
  selector: 'app-sale-form',
  imports: [FormsModule, CustomerSearchComponent, SaleProductItemComponent],
  templateUrl: './sale-form.component.html',
  styleUrl: './sale-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SaleFormService],
})
export class SaleFormComponent {
  private dialogRef = inject(DIALOG_REF) as DialogRef<SaleInput>;
  private dialogData = inject(DIALOG_DATA) as Sale | null;
  readonly formService = inject(SaleFormService);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('.product-search-wrapper')) {
      this.formService.isProductDropdownOpen.set(false);
    }
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  confirm(): void {
    if (!this.formService.canSubmit()) return;

    const existingSale = this.formService.existingSale();
    const selectedCustomer = this.formService.selectedCustomer();
    if (!existingSale && !selectedCustomer) return;

    const sale: SaleInput = {
      date: existingSale?.date ?? Timestamp.now(),
      deliveryDate: this.formService.toTimestampFromDateInput(this.formService.deliveryDateInput),
      customerId: existingSale?.customerId ?? selectedCustomer?.id ?? null,
      customerName: existingSale?.customerName ?? selectedCustomer?.name ?? '',
      items: this.formService.items(),
      total: this.formService.total(),
      totalCost: this.formService.totalCost(),
      profit: this.formService.profit(),
      isPaid: this.formService.isPaid,
      paymentMethod: this.formService.paymentMethod,
      status: existingSale?.status ?? 'pending',
      notes: this.formService.notes,
    };

    this.dialogRef.close(sale);
  }
}

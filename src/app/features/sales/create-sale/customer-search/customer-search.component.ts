import { ChangeDetectionStrategy, Component, HostListener, input, output, viewChild, ElementRef } from '@angular/core';
import { NgModel, FormsModule } from '@angular/forms';
import { Customer } from '../../../../core/models/customer';

@Component({
  selector: 'app-customer-search',
  imports: [FormsModule],
  templateUrl: './customer-search.component.html',
  styleUrl: './customer-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerSearchComponent {
  readonly selectedCustomer = input<Customer | null>(null);
  readonly isEdit = input(false);
  readonly filteredCustomers = input<Customer[]>([]);
  readonly customerSearch = input('');
  readonly isDropdownOpen = input(false);

  readonly selectCustomer = output<Customer>();
  readonly clearCustomer = output<void>();
  readonly searchChange = output<string>();
  readonly searchFocus = output<void>();
  readonly closeDropdown = output<void>();

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('customerSearchInput');

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('.customer-search-wrapper')) {
      this.closeDropdown.emit();
    }
  }

  onSelect(customer: Customer): void {
    this.selectCustomer.emit(customer);
  }

  onClear(): void {
    this.clearCustomer.emit();
    this.searchInput()?.nativeElement.focus();
  }

  onSearchChange(value: string): void {
    this.searchChange.emit(value);
  }

  onSearchFocus(): void {
    this.searchFocus.emit();
  }
}

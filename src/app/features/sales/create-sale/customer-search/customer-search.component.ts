import { ChangeDetectionStrategy, Component, HostListener, input, output, viewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  readonly clearCustomer = output<undefined>();
  readonly searchChange = output<string>();
  readonly searchFocus = output<undefined>();
  readonly closeDropdown = output<undefined>();

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('customerSearchInput');

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('.customer-search-wrapper')) {
      this.closeDropdown.emit(undefined);
    }
  }

  onSelect(customer: Customer): void {
    this.selectCustomer.emit(customer);
  }

  onClear(): void {
    this.clearCustomer.emit(undefined);
    this.searchInput()?.nativeElement.focus();
  }

  onSearchChange(value: string): void {
    this.searchChange.emit(value);
  }

  onSearchFocus(): void {
    this.searchFocus.emit(undefined);
  }
}

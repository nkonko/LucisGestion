import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Timestamp } from 'firebase/firestore';
import { LowStockComponent } from './low-stock.component';

describe('LowStockComponent', () => {
  let fixture: ComponentFixture<LowStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LowStockComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LowStockComponent);
    fixture.componentRef.setInput('items', [
      {
        id: 'ing-1',
        name: 'Harina 000',
        unit: 'kg',
        unitPrice: 200,
        currentStock: 3,
        minimumStock: 10,
        category: 'dry',
        lastPurchase: Timestamp.now(),
        active: true,
      },
    ]);
    fixture.detectChanges();
  });

  it('renders low stock ingredient info', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Harina 000');
    expect(text).toContain('3/10');
  });
});

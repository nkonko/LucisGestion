import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopCustomersComponent } from './top-customers.component';

describe('TopCustomersComponent', () => {
  let fixture: ComponentFixture<TopCustomersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopCustomersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TopCustomersComponent);
    fixture.componentRef.setInput('customers', [
      { name: 'Cliente A', revenue: 120000, share: 60, ordersCount: 7 },
      { name: 'Cliente B', revenue: 80000, share: 40, ordersCount: 4 },
    ]);
    fixture.detectChanges();
  });

  it('renders customer names and share', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Cliente A');
    expect(text).toContain('Cliente B');
    expect(text).toContain('60%');
  });
});

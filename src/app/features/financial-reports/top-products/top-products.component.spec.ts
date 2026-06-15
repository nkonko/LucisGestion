import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TopProductsComponent } from './top-products.component';

describe('TopProductsComponent', () => {
  let fixture: ComponentFixture<TopProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopProductsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TopProductsComponent);
    fixture.componentRef.setInput('products', [
      { name: 'Tarta de coco', quantity: 12, revenue: 240000, margin: 45 },
    ]);
    fixture.detectChanges();
  });

  it('renders the product table rows', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Tarta de coco');
    expect(text).toContain('12');
    expect(text).toContain('45%');
  });
});

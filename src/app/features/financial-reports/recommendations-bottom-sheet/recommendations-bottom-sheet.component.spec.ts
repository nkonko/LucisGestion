import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecommendationsBottomSheetComponent } from './recommendations-bottom-sheet.component';
import { DIALOG_DATA } from '../../../core/models/dialog/dialog-tokens.model';
import { GeminiRecommendation } from '../../../core/services/gemini-recommendations.service';
import { RecommendationsPdfService } from '../services/recommendations-pdf.service';

describe('RecommendationsBottomSheetComponent', () => {
  let component: RecommendationsBottomSheetComponent;
  let fixture: ComponentFixture<RecommendationsBottomSheetComponent>;
  const recommendationsPdfServiceSpy = {
    exportRecommendations: vi.fn(),
  };

  const mockData: GeminiRecommendation[] = [
    {
      title: 'Test Recommendation 1',
      description: 'Test description 1',
      actionItems: ['Action 1', 'Action 2'],
      urgency: 'alta',
    },
    {
      title: 'Test Recommendation 2',
      description: 'Test description 2',
      actionItems: ['Action 3'],
      urgency: 'media',
    },
  ];

  beforeEach(async () => {
    recommendationsPdfServiceSpy.exportRecommendations.mockReset();

    await TestBed.configureTestingModule({
      imports: [RecommendationsBottomSheetComponent],
      providers: [
        {
          provide: DIALOG_DATA,
          useValue: mockData,
        },
        { provide: RecommendationsPdfService, useValue: recommendationsPdfServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RecommendationsBottomSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title', () => {
    const title = fixture.nativeElement.querySelector('.recommendations-title');
    expect(title.textContent).toContain('Test Recommendation 1');
  });

  it('should display description', () => {
    const description = fixture.nativeElement.querySelector('.recommendations-description');
    expect(description.textContent).toContain('Test description 1');
  });

  it('should display action items', () => {
    const actions = fixture.nativeElement.querySelectorAll('.action-item');
    expect(actions.length).toBe(2);
  });

  it('should display urgency badge', () => {
    const badge = fixture.nativeElement.querySelector('.urgency-badge');
    expect(badge.textContent).toContain('Urgente');
  });

  it('should navigate to next recommendation', () => {
    component.nextRecommendation();
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('.recommendations-title');
    expect(title.textContent).toContain('Test Recommendation 2');
  });

  it('should export recommendations as pdf', () => {
    component.exportPdf();
    expect(recommendationsPdfServiceSpy.exportRecommendations).toHaveBeenCalled();
  });
});

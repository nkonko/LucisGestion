import { afterNextRender, ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IngredientsStore } from '../../../core/store/ingredients.store';
import { calculateRecipeCost, calculateSuggestedPrice } from '../../../core/utils/pricing.utils';
import { Recipe, RecipeCategory } from '../../../core/models/recipe';
import { RecipeIngredient } from '../../../core/models/ingredient';
import { DIALOG_DATA, DIALOG_REF } from '../../../core/models/dialog/dialog-tokens.model';
import { DialogRef } from '../../../core/models/dialog/dialog-ref.model';
import { StepperComponent } from '../../../shared/ui/stepper/stepper.component';
import { CategoryFormComponent } from './category-form/category-form.component';
import { RecipeIngredientFormComponent } from './ingredient-form/ingredient-form.component';
import { CostFormComponent } from './cost-form/cost-form.component';
import { UiIconComponent } from '../../../shared/ui/components';

const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'] as const;

@Component({
  selector: 'app-recipe-wizard',
  imports: [
    FormsModule,
    StepperComponent,
    CategoryFormComponent,
    RecipeIngredientFormComponent,
    CostFormComponent,
    UiIconComponent,
  ],
  templateUrl: './recipe-wizard.component.html',
  styleUrl: './recipe-wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeWizardComponent {
  private dialogRef = inject(DIALOG_REF) as DialogRef<Recipe | 'delete'>;
  private data = inject(DIALOG_DATA) as Recipe | null;
  private ingredientsStore = inject(IngredientsStore);
  private hostElement = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly isEdit = !!this.data;

  constructor() {
    afterNextRender(() => this.updatePanelHeight());

    // Re-measure when ingredients change (add/remove/resize step 2)
    effect(() => {
      this.recipeIngredients();
      requestAnimationFrame(() => this.updatePanelHeight());
    });
  }

  /** Measure the full panel content and set an explicit height so CSS transitions animate it. */
  private updatePanelHeight(): void {
    const panel = this.hostElement.nativeElement.closest('.ui-bottom-sheet-panel') as HTMLElement | null;
    if (!panel) return;

    const host = this.hostElement.nativeElement;
    const header = panel.querySelector('.ui-bottom-sheet-header') as HTMLElement | null;
    const stepper = host.querySelector('app-stepper') as HTMLElement | null;
    const body = host.querySelector('.wizard__body') as HTMLElement | null;
    const footer = host.querySelector('.wizard__footer') as HTMLElement | null;

    const headerHeight = header?.offsetHeight ?? 0;
    const stepperHeight = stepper?.offsetHeight ?? 0;
    const footerHeight = footer?.offsetHeight ?? 0;

    // Measure the natural body content height by summing its direct children
    // (not body.scrollHeight/offsetHeight, which returns the flex-stretched height
    // and causes stale measurements when going back to a shorter step).
    let bodyHeight = 0;
    if (body) {
      const style = getComputedStyle(body);
      const paddingTop = parseFloat(style.paddingTop) || 0;
      const paddingBottom = parseFloat(style.paddingBottom) || 0;
      const gap = parseFloat(style.gap) || 0;
      const children = Array.from(body.children) as HTMLElement[];
      const childrenHeight = children.reduce((sum, child) => sum + child.offsetHeight, 0);
      const gapsHeight = children.length > 1 ? gap * (children.length - 1) : 0;
      bodyHeight = paddingTop + paddingBottom + childrenHeight + gapsHeight;
    }

    // When on step 1 (ingredients), reserve space for the search dropdown
    // so it doesn't open below the visible area.
    if (this.currentStep() === 1) {
      bodyHeight += 280;
    }

    const total = headerHeight + stepperHeight + bodyHeight + footerHeight;
    const max = window.innerHeight * 0.92;

    panel.style.height = Math.min(total, max) + 'px';
  }

  readonly stepLabels = ['Datos básicos', 'Ingredientes', 'Costos', 'Notas'];
  readonly currentStep = signal(0);

  readonly name = signal(this.data?.name ?? '');
  readonly category = signal((this.data?.category ?? 'cakes') as RecipeCategory);
  readonly yieldValue = signal(this.data?.yield ?? 1);
  readonly salePrice = signal(this.data?.salePrice ?? 0);
  readonly notes = signal(this.data?.notes ?? '');
  readonly imageUrl = signal(this.data?.imageUrl ?? '');

  readonly profitMargin = signal(this.data?.profitMargin ?? 60);
  readonly recipeIngredients = signal<RecipeIngredient[]>(
    this.data?.ingredients ? [...this.data.ingredients] : [],
  );

  readonly calculatedCost = computed(() =>
    calculateRecipeCost(this.recipeIngredients(), this.ingredientsStore.ingredients()),
  );

  readonly suggestedPrice = computed(() =>
    calculateSuggestedPrice(this.calculatedCost(), this.profitMargin()),
  );

  readonly imageUrlValidationMessage = computed(() => this.validateImageUrl(this.imageUrl()));
  readonly isImageUrlValid = computed(() => this.imageUrlValidationMessage() === null);

  // Dirty tracking (edit mode only) — reads all signal fields so computed
  // re-evaluates on ANY form change, not just profitMargin/ingredients.
  private readonly baseline = signal(this.createSnapshot());
  readonly isDirty = computed(() => this.isEdit && this.createSnapshot() !== this.baseline());

  private createSnapshot(): string {
    return JSON.stringify({
      name: this.name(),
      category: this.category(),
      yield: this.yieldValue(),
      salePrice: this.salePrice(),
      profitMargin: this.profitMargin(),
      notes: this.notes(),
      imageUrl: this.imageUrl(),
      ingredients: this.recipeIngredients().map((i) => ({ ...i })),
    });
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 0:
        return !!this.name();
      case 1:
        return this.recipeIngredients().length > 0;
      case 2:
        return true;
      case 3:
        return this.isImageUrlValid();
      default:
        return false;
    }
  }

  private validateImageUrl(rawValue: string): string | null {
    const value = rawValue.trim();
    if (!value) return null;

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(value);
    } catch {
      return 'Ingresá una URL válida (http o https).';
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return 'La URL debe empezar con http:// o https://.';
    }

    const path = parsedUrl.pathname.toLowerCase();
    const extension = path.includes('.') ? path.slice(path.lastIndexOf('.') + 1) : '';

    if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension as (typeof ALLOWED_IMAGE_EXTENSIONS)[number])) {
      return 'Usá una URL con extensión válida: .jpg, .jpeg, .png, .webp, .gif o .avif.';
    }

    return null;
  }

  goToStep(n: number): void {
    // Edit mode + dirty → free navigation, se puede mover entre pasos
    if (this.isEdit && this.isDirty()) {
      this.currentStep.set(n);
      requestAnimationFrame(() => this.updatePanelHeight());
      return;
    }

    // Ir para atrás siempre se permite
    if (n < this.currentStep()) {
      this.currentStep.set(n);
      requestAnimationFrame(() => this.updatePanelHeight());
      return;
    }

    // Ir para adelante: solo un paso a la vez y el paso actual debe ser válido
    if (n === this.currentStep() + 1 && this.isStepValid(this.currentStep())) {
      this.currentStep.set(n);
      requestAnimationFrame(() => this.updatePanelHeight());
      return;
    }

    // Mismo paso o salteo no permitido — no hace nada
  }

  next(): void {
    if (this.isStepValid(this.currentStep())) {
      this.currentStep.update((n) => n + 1);
      requestAnimationFrame(() => this.updatePanelHeight());
    }
  }

  prev(): void {
    this.currentStep.update((n) => n - 1);
    requestAnimationFrame(() => this.updatePanelHeight());
  }

  save(): void {
    if (!this.isStepValid(this.currentStep())) return;

    const cost = this.calculatedCost();
    const suggested = this.suggestedPrice();

    this.dialogRef.close({
      name: this.name(),
      category: this.category(),
      yield: this.yieldValue(),
      salePrice: this.salePrice() || suggested,
      notes: this.notes(),
      imageUrl: this.imageUrl().trim(),
      profitMargin: this.profitMargin(),
      ingredients: this.recipeIngredients(),
      calculatedCost: cost,
      suggestedPrice: suggested,
      active: true,
    } as Recipe);
  }

  remove(): void {
    this.dialogRef.close('delete');
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }
}

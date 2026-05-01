import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IngredientsStore } from '../../core/store/ingredients.store';
import { UiIconComponent } from '../ui/components';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive, UiIconComponent],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  private ingredientsStore = inject(IngredientsStore);

  readonly lowStockCount = this.ingredientsStore.lowStockCount;
}
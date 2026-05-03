import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { BrandHeaderComponent } from './brand-header/brand-header.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, BottomNavComponent, BrandHeaderComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  readonly isBrandCompact = signal(false);

  onBrandCompactChanged(isCompact: boolean): void {
    this.isBrandCompact.set(isCompact);
  }
}

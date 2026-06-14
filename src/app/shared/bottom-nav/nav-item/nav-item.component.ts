import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UiIconComponent } from '../../ui/components';

@Component({
  selector: 'app-nav-item',
  imports: [RouterLink, RouterLinkActive, UiIconComponent],
  templateUrl: './nav-item.component.html',
  styleUrls: ['./nav-item.component.scss'],
})
export class NavItemComponent {
  route = input.required<string>();
  icon = input.required<string>();
  label = input.required<string>();
  badge = input<number>(0);
  secondary = input<boolean>(false);
  exact = input<boolean>(false);
}

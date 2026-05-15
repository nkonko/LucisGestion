import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { UiToastComponent } from './shared/ui/components/ui-toast/ui-toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UiToastComponent],
  template: `
    <router-outlet />
    <ui-toast />
  `,
})
export class App {}

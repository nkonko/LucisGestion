import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  Injector,
  Type,
  createComponent,
  inject,
} from '@angular/core';
import { DialogConfig } from '../models/dialog/dialog-config.model';
import { DialogRef } from '../models/dialog/dialog-ref.model';
import { DIALOG_DATA, DIALOG_REF } from '../models/dialog/dialog-tokens.model';
import { UiModalHostComponent } from '../../shared/ui-modal/ui-modal-host.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly appRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);

  open<TData, TResult>(
    component: Type<unknown>,
    config: DialogConfig<TData>,
  ): DialogRef<TResult> {
    const dialogRef = new DialogRef<TResult>();
    const previousFocus = this.getFocusableActiveElement();

    const contentInjector = Injector.create({
      providers: [
        { provide: DIALOG_DATA, useValue: config.data },
        { provide: DIALOG_REF, useValue: dialogRef },
      ],
      parent: this.environmentInjector,
    });

    const hostRef = createComponent(UiModalHostComponent, {
      environmentInjector: this.environmentInjector,
    });

    hostRef.setInput('contentComponent', component);
    hostRef.setInput('contentInjector', contentInjector);
    hostRef.setInput('maxWidth', config.maxWidth ?? '560px');
    hostRef.setInput('width', config.width ?? '100%');
    hostRef.setInput('maxHeight', config.maxHeight ?? null);
    hostRef.setInput('panelClass', config.panelClass ?? null);
    hostRef.setInput('closeOnBackdropClick', config.closeOnBackdropClick ?? true);

    const closeEffect = hostRef.instance.closeRequested.subscribe(() => {
      dialogRef.close(undefined);
    });

    this.attachToDom(hostRef);

    dialogRef.afterClosed.subscribe(() => {
      closeEffect.unsubscribe();
      this.detachFromDom(hostRef);
      previousFocus?.focus();
    });

    return dialogRef;
  }

  private attachToDom(hostRef: ComponentRef<UiModalHostComponent>): void {
    this.appRef.attachView(hostRef.hostView);
    document.body.appendChild(hostRef.location.nativeElement);
  }

  private detachFromDom(hostRef: ComponentRef<UiModalHostComponent>): void {
    this.appRef.detachView(hostRef.hostView);
    hostRef.destroy();
  }

  private getFocusableActiveElement(): HTMLElement | null {
    const element = document.activeElement;
    return element instanceof HTMLElement ? element : null;
  }
}

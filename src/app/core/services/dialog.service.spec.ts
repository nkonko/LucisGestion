import { Component, Injector, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { DialogService } from './dialog.service';
import { DIALOG_DATA, DIALOG_REF } from '../models/dialog/dialog-tokens.model';
import { DialogRef } from '../models/dialog/dialog-ref.model';

@Component({
  selector: 'app-test-dialog-content',
  template: '<button type="button" data-initial-focus>Cerrar</button>',
})
class TestDialogContentComponent {
  static lastInstance: TestDialogContentComponent | null = null;

  readonly data = inject(DIALOG_DATA) as { customerId: string };
  readonly dialogRef = inject(DIALOG_REF) as DialogRef<string>;

  constructor() {
    TestDialogContentComponent.lastInstance = this;
  }
}

describe('DialogService', () => {
  let service: DialogService;

  beforeEach(() => {
    TestDialogContentComponent.lastInstance = null;

    TestBed.configureTestingModule({
      imports: [TestDialogContentComponent],
      providers: [DialogService],
    });

    service = TestBed.inject(DialogService);
  });

  afterEach(() => {
    document.querySelectorAll('app-ui-modal-host').forEach((node) => node.remove());
  });

  it('injects DIALOG_DATA and DIALOG_REF into dynamic content components', () => {
    const injectorCreateSpy = vi.spyOn(Injector, 'create');
    const data = { customerId: 'c-1' };
    const dialogRef = service.open<typeof data, string>(TestDialogContentComponent, { data });

    expect(injectorCreateSpy).toHaveBeenCalledTimes(1);

    const createConfig = injectorCreateSpy.mock.calls[0][0];
    const providers = createConfig.providers as Array<{ provide: unknown; useValue: unknown }>;

    const dataProvider = providers.find((provider) => provider.provide === DIALOG_DATA);
    const dialogRefProvider = providers.find((provider) => provider.provide === DIALOG_REF);

    expect(dataProvider?.useValue).toEqual(data);
    expect(dialogRefProvider?.useValue).toBe(dialogRef);

    injectorCreateSpy.mockRestore();
    dialogRef.close('ok');
  });

  it('closes when backdrop is clicked and emits undefined result', () => {
    const afterClosed = vi.fn();
    const dialogRef = service.open<null, string>(TestDialogContentComponent, { data: null });
    dialogRef.afterClosed.subscribe(afterClosed);

    const backdrop = document.querySelector('.ui-modal-backdrop') as HTMLElement;
    expect(backdrop).toBeTruthy();

    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(afterClosed).toHaveBeenCalledTimes(1);
    expect(afterClosed).toHaveBeenCalledWith(undefined);
  });

  it('restores previous focus and detaches host after close', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'open dialog';
    document.body.appendChild(trigger);
    trigger.focus();

    const dialogRef = service.open<null, string>(TestDialogContentComponent, { data: null });

    await Promise.resolve();
    dialogRef.close('done');

    expect(document.activeElement).toBe(trigger);
    expect(document.querySelector('app-ui-modal-host')).toBeNull();

    trigger.remove();
  });
});

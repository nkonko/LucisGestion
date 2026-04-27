import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { NotificationService } from './notification.service';
import { UiToastService } from '../../shared/ui/services/ui-toast.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let toastServiceMock: Pick<UiToastService, 'show'>;

  beforeEach(() => {
    toastServiceMock = {
      show: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: UiToastService, useValue: toastServiceMock },
      ],
    });

    service = TestBed.inject(NotificationService);
  });

  it('delegates success notifications preserving the message and duration', () => {
    service.success('Guardado correctamente', 2500);

    expect(toastServiceMock.show).toHaveBeenCalledTimes(1);
    expect(toastServiceMock.show).toHaveBeenCalledWith('Guardado correctamente', 'success', 2500);
  });

  it('delegates error notifications prefixing the message', () => {
    service.error('Falló', 3200);

    expect(toastServiceMock.show).toHaveBeenCalledTimes(1);
    expect(toastServiceMock.show).toHaveBeenCalledWith('Error: Falló', 'error', 3200);
  });

  it('uses Error.message in errorFrom when the source is an Error', () => {
    service.errorFrom(new Error('Sin conexión'), 'Mensaje fallback', 4100);

    expect(toastServiceMock.show).toHaveBeenCalledTimes(1);
    expect(toastServiceMock.show).toHaveBeenCalledWith('Error: Sin conexión', 'error', 4100);
  });

  it('uses fallback message in errorFrom when the source is not an Error', () => {
    service.errorFrom({ reason: 'failure' }, 'No se pudo procesar', 4100);

    expect(toastServiceMock.show).toHaveBeenCalledTimes(1);
    expect(toastServiceMock.show).toHaveBeenCalledWith('Error: No se pudo procesar', 'error', 4100);
  });
});

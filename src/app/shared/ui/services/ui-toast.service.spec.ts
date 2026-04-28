import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UiToastService } from './ui-toast.service';

describe('UiToastService', () => {
  let service: UiToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue('00000000-0000-4000-8000-000000000000');

    TestBed.configureTestingModule({
      providers: [UiToastService],
    });

    service = TestBed.inject(UiToastService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('auto-dismisses using the provided duration before removal animation', () => {
    service.show('Guardado', 'success', 1200, '✓');

    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0].id).toBe('00000000-0000-4000-8000-000000000000');
    expect(service.toasts()[0].dismissing).toBeUndefined();

    vi.advanceTimersByTime(1199);
    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0].dismissing).toBeUndefined();

    vi.advanceTimersByTime(1);
    expect(service.toasts()).toHaveLength(1);
    expect(service.toasts()[0].dismissing).toBe(true);

    vi.advanceTimersByTime(350);
    expect(service.toasts()).toHaveLength(0);
  });
});

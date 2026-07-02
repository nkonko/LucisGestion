import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { APP_RELOAD, AppUpdateService } from './app-update.service';
import { NotificationService } from './notification.service';

describe('AppUpdateService', () => {
  it('checks for updates when app becomes stable', async () => {
    const versionUpdates$ = new Subject<unknown>();
    const isStable$ = new Subject<boolean>();

    const swUpdateMock = {
      isEnabled: true,
      versionUpdates: versionUpdates$.asObservable(),
      checkForUpdate: vi.fn().mockResolvedValue(false),
      activateUpdate: vi.fn().mockResolvedValue(true),
    };

    const notificationMock = {
      info: vi.fn(),
      error: vi.fn(),
      success: vi.fn(),
      errorFrom: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AppUpdateService,
        { provide: SwUpdate, useValue: swUpdateMock },
        { provide: ApplicationRef, useValue: { isStable: isStable$.asObservable() } },
        { provide: NotificationService, useValue: notificationMock },
      ],
    });

    TestBed.inject(AppUpdateService);
    isStable$.next(true);

    await Promise.resolve();

    expect(swUpdateMock.checkForUpdate).toHaveBeenCalled();
  });

  it('activates and reloads when a new version is ready', async () => {
    const versionUpdates$ = new Subject<unknown>();
    const isStable$ = new Subject<boolean>();

    const swUpdateMock = {
      isEnabled: true,
      versionUpdates: versionUpdates$.asObservable(),
      checkForUpdate: vi.fn().mockResolvedValue(false),
      activateUpdate: vi.fn().mockResolvedValue(true),
    };

    const notificationMock = {
      info: vi.fn(),
      error: vi.fn(),
      success: vi.fn(),
      errorFrom: vi.fn(),
    };
    const reloadSpy = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        AppUpdateService,
        { provide: SwUpdate, useValue: swUpdateMock },
        { provide: ApplicationRef, useValue: { isStable: isStable$.asObservable() } },
        { provide: NotificationService, useValue: notificationMock },
        { provide: APP_RELOAD, useValue: reloadSpy },
      ],
    });

    TestBed.inject(AppUpdateService);

    versionUpdates$.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'old', appData: {} },
      latestVersion: { hash: 'new', appData: {} },
    });

    await Promise.resolve();
    await Promise.resolve();

    expect(swUpdateMock.activateUpdate).toHaveBeenCalled();
    expect(notificationMock.info).toHaveBeenCalled();
    expect(reloadSpy).toHaveBeenCalled();
  });
});

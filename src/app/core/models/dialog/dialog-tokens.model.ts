import { InjectionToken } from '@angular/core';
import { DialogRef } from './dialog-ref.model';

export const DIALOG_DATA = new InjectionToken<unknown>('DIALOG_DATA');

export const DIALOG_REF = new InjectionToken<DialogRef<unknown>>('DIALOG_REF');

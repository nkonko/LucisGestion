import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  Type,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';

@Component({
  selector: 'app-ui-modal-host',
  imports: [NgComponentOutlet],
  templateUrl: './ui-modal-host.component.html',
  styleUrl: './ui-modal-host.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown)': 'onKeydown($event)',
  },
})
export class UiModalHostComponent implements AfterViewInit {
  readonly contentComponent = input.required<Type<unknown>>();
  readonly contentInjector = input.required<Injector>();
  readonly maxWidth = input('560px');
  readonly width = input('100%');
  readonly maxHeight = input<string | null>(null);
  readonly panelClass = input<string | null>(null);
  readonly closeOnBackdropClick = input(true);

  readonly closeRequested = output<undefined>();

  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');

  readonly panelClasses = computed(() => {
    const customClass = this.panelClass();
    return customClass ? `ui-modal-panel ${customClass}` : 'ui-modal-panel';
  });

  ngAfterViewInit(): void {
    queueMicrotask(() => {
      this.focusInitialElement();
    });
  }

  requestClose(): void {
    this.closeRequested.emit(undefined);
  }

  onBackdropClick(event: MouseEvent): void {
    if (!this.closeOnBackdropClick()) {
      return;
    }

    if (event.target === event.currentTarget) {
      this.requestClose();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.requestClose();
      return;
    }

    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  private focusInitialElement(): void {
    const panelElement = this.panel().nativeElement;
    const initial = panelElement.querySelector<HTMLElement>('[data-initial-focus]');
    const autofocus = panelElement.querySelector<HTMLElement>('[autofocus]');
    const fallback = this.getFocusableElements()[0];

    (initial ?? autofocus ?? fallback ?? panelElement).focus();
  }

  private trapFocus(event: KeyboardEvent): void {
    const focusable = this.getFocusableElements();
    if (focusable.length === 0) {
      event.preventDefault();
      this.panel().nativeElement.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const htmlActiveElement = document.activeElement as HTMLElement | null;

    if (event.shiftKey && htmlActiveElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && htmlActiveElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private getFocusableElements(): HTMLElement[] {
    const panelElement = this.panel().nativeElement;
    const selector = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(panelElement.querySelectorAll<HTMLElement>(selector)).filter(
      (element) => !element.hasAttribute('aria-hidden'),
    );
  }
}

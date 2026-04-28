import { Component, Injector } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UiModalHostComponent } from './ui-modal-host.component';

@Component({
  selector: 'app-focus-content',
  template: `
    <button type="button" id="first" data-initial-focus>Primero</button>
    <button type="button" id="last">Ultimo</button>
  `,
})
class FocusContentComponent {}

describe('UiModalHostComponent', () => {
  let fixture: ComponentFixture<UiModalHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiModalHostComponent, FocusContentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiModalHostComponent);
    fixture.componentRef.setInput('contentComponent', FocusContentComponent);
    fixture.componentRef.setInput('contentInjector', TestBed.inject(Injector));
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('traps focus from last to first on Tab', () => {
    const htmlHostElement = fixture.nativeElement as HTMLElement;
    const htmlFirstButton = htmlHostElement.querySelector('#first') as HTMLButtonElement;
    const htmlLastButton = htmlHostElement.querySelector('#last') as HTMLButtonElement;

    htmlLastButton.focus();
    htmlHostElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));

    expect(document.activeElement).toBe(htmlFirstButton);
  });

  it('traps focus from first to last on Shift+Tab', () => {
    const htmlHostElement = fixture.nativeElement as HTMLElement;
    const htmlFirstButton = htmlHostElement.querySelector('#first') as HTMLButtonElement;
    const htmlLastButton = htmlHostElement.querySelector('#last') as HTMLButtonElement;

    htmlFirstButton.focus();
    htmlHostElement.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }),
    );

    expect(document.activeElement).toBe(htmlLastButton);
  });
});

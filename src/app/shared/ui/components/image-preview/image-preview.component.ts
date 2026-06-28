import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { UiIconComponent } from '../ui-icon/ui-icon.component';

@Component({
  selector: 'app-image-preview',
  imports: [UiIconComponent],
  templateUrl: './image-preview.component.html',
  styleUrl: './image-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImagePreviewComponent {
  readonly imageUrl = input.required<string>();
  readonly closed = output();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    this.closed.emit();
  }
}

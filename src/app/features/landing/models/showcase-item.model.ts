import type { SplitMediaCardImagePosition } from '../../../shared/ui/components/split-media-card/split-media-card.component';

export interface ShowcaseItem {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  imagePosition: SplitMediaCardImagePosition;
}
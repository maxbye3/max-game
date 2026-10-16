import { hasAlexEatenDoughnut } from '../core/alex-w-state.js';
import { isAlexPlayer } from '../core/player-character.js';
import { images } from '../../data/photos-journal.json';
import { PhotoGalleryController } from './photo-gallery.js';

export class JournalGalleryController extends PhotoGalleryController {
  constructor(onClose: () => void) {
    super({
      panelId: 'journal-gallery-panel',
      galleryId: 'journal-gallery',
      closeId: 'journal-gallery-close',
      lightboxId: 'journal-lightbox',
      label: 'Journal page',
      dataPath: '../data/photos-journal.json',
    }, onClose, images);
  }

  override open(): void {
    if (!isAlexPlayer() || !hasAlexEatenDoughnut()) return;
    super.open();
  }
}

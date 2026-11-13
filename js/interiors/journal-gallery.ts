import { hasAlexEatenDoughnut } from '../core/alex-w-state.js';
import { isAlexPlayer } from '../core/player-character.js';
import encryptedPhotos from '../../data/protected/photos-journal.json';
import { PHOTO_KEYS } from '../generated/interiors/photo-keys.generated.js';
import { PhotoGalleryController } from './photo-gallery.js';
import { decodeProtectedPhotos } from './protected-photos.js';

export class JournalGalleryController extends PhotoGalleryController {
  constructor(onClose: () => void) {
    super({
      panelId: 'journal-gallery-panel',
      galleryId: 'journal-gallery',
      closeId: 'journal-gallery-close',
      lightboxId: 'journal-lightbox',
      label: 'Journal page',
      dataPath: '../data/protected/photos-journal.json',
      decode: data => decodeProtectedPhotos(data, PHOTO_KEYS.journal),
      clearOnHide: true,
    }, onClose, () => decodeProtectedPhotos(encryptedPhotos, PHOTO_KEYS.journal));
  }

  override open(): void {
    if (!isAlexPlayer() || !hasAlexEatenDoughnut()) return;
    super.open();
  }
}

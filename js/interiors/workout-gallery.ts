import encryptedPhotos from '../../data/protected/photos-workout.json';
import { PHOTO_KEYS } from '../generated/interiors/photo-keys.generated.js';
import { isAlexPlayer } from '../core/player-character.js';
import { PhotoGalleryController } from './photo-gallery.js';
import { decodeProtectedPhotos } from './protected-photos.js';

export class WorkoutGalleryController extends PhotoGalleryController {
  constructor(onClose: () => void) {
    super({
      panelId: 'tim-workout-journal-panel',
      galleryId: 'workout-gallery',
      closeId: 'tim-workout-journal-close',
      lightboxId: 'workout-lightbox',
      label: 'Workout',
      dataPath: '../data/protected/photos-workout.json',
      decode: data => decodeProtectedPhotos(data, PHOTO_KEYS.workout),
      clearOnHide: true,
    }, onClose, () => decodeProtectedPhotos(encryptedPhotos, PHOTO_KEYS.workout));
  }

  override open(): void {
    if (!isAlexPlayer()) return;
    super.open();
  }
}

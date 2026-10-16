import { images } from '../../data/photos-workout.json';
import { PhotoGalleryController } from './photo-gallery.js';

export class WorkoutGalleryController extends PhotoGalleryController {
  constructor(onClose: () => void) {
    super({
      panelId: 'tim-workout-journal-panel',
      galleryId: 'workout-gallery',
      closeId: 'tim-workout-journal-close',
      lightboxId: 'workout-lightbox',
      label: 'Workout',
      dataPath: '../data/photos-workout.json',
    }, onClose, images);
  }
}

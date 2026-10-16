import { images } from '../../data/photos-plants.json';
import { PhotoGalleryController } from './photo-gallery.js';

export class PlantDiaryGalleryController extends PhotoGalleryController {
  constructor(onClose: () => void) {
    super({
      panelId: 'plant-diary-panel',
      galleryId: 'plant-diary-gallery',
      closeId: 'plant-diary-close',
      lightboxId: 'plant-diary-lightbox',
      label: 'Plant diary',
      dataPath: '../data/photos-plants.json',
    }, onClose, images);
  }
}

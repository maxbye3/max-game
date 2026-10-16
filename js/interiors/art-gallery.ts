import { images } from '../../data/photos-art.json';
import { PhotoGalleryController } from './photo-gallery.js';

export class ArtGalleryController extends PhotoGalleryController {
  constructor(onClose: () => void) {
    super({
      panelId: 'art-gallery-panel',
      galleryId: 'art-gallery-thumbnails',
      closeId: 'art-gallery-close',
      lightboxId: 'art-gallery-lightbox',
      label: 'Artwork',
      dataPath: '../data/photos-art.json',
    }, onClose, images);
  }
}

import { requireElement } from './dom.js';

const PLANT_DIARY_IMAGE_SOURCES = [
  'https://lh3.googleusercontent.com/pw/AP1GczPPl_C7joODre0yauMBXS8fGAY-_YxtBya34DX5w0p0tnh5Cme-fMFgyiL6-L-RfQBwtg4Nu1waXazhmw7NsuBpB422HTaIf9QnGTJthxnGVdd95qgK',
  'https://lh3.googleusercontent.com/pw/AP1GczOm_Rf8F0DNHWIhWbCDdKtXKiD2_BMBVDHQJ7McpCO4v48XSdWOcybBRUcRlMbEvmwPfaWc9nYBpKf16Y_e1mwk1bhKzJMgu6hHSFBl2tdm2WON9e4C',
  'https://lh3.googleusercontent.com/pw/AP1GczNaPSRDUScaVZGP5_HWpIqrlrrXdvU4Kejqg8pX4ApupFZ-puOzP2S-zlmcOcTq1jkwXYI4OiHV4VQURIZCna6nXhvbSE-GOKv-qZzQUnDfh8YvwbIu',
  'https://lh3.googleusercontent.com/pw/AP1GczOuufpLEhDADFns8S5bXcRbBQgTq0dELyw3nt4KIaHtCdJ-AanAG_ninK4eq1NZSMAMMxM3QUCK0_lqL5yBO0O0Rl6ah7S2s_XhVzpZJQ6z7YWpDRfj',
  'https://lh3.googleusercontent.com/pw/AP1GczOcu8HSIl_M7Q-oxga_DngkvbHtkEcj4iENJxPY0g0n6N9PORt9c1Z5f0bAS7UHT54MxAj_mHSH1Mi67jQ6LtRvjsb0QDEW6zoOhYPPrp_1o06sbDX0',
  'https://lh3.googleusercontent.com/pw/AP1GczMuDMHuwfIVbV_dZcnv265c1jY9xkWgeXpPqtpxMSD5dFScsWkBIGdZLJirNgUnMxGHLK_su6Ddbj1HahvEipbipwFEFsHQhYISRFVQhS5ZpTvWtxLC',
  'https://lh3.googleusercontent.com/pw/AP1GczOQiud2Ty-UyMyzr5zXU2fYodxL5Xr6CqUtIFFOHgMJrGCmYwfCyTCH_ptpAJ4BD6ngoGVQMlfRzyzeCydwjkue6r4NkQteaTPN8eBCLCYwhTYM-9PO',
  'https://lh3.googleusercontent.com/pw/AP1GczObjgU9FWGrSwcR3cfhJEPgzT6_JUulv-wvG_wkf6Nsscg1gpeNn_8LdS1FCCP56t3keTnV_gyz6-4q0KPg3hp2Bqtu6C8saCu9A4IHKokzACMs_iLP',
  'https://lh3.googleusercontent.com/pw/AP1GczMAkHTNKrMjtzGmJLjwVPzmeDlw2iMkOQAXc87lO_2ywnMOe22CUqVwIUyhUsjjiXonZWdGWxbjpl63OWUKG4_rapdp2jr0d4RbDXOCdqE9n97DcQb5',
  'https://lh3.googleusercontent.com/pw/AP1GczNRYiAqIVYXFESYRqZ5Lz_-6tfnltFuq6X_kBdoGSISHhlttgSkiboWANKVoc0LEwM74KR9-F5TKGqDDxrn7eN0pDXTJp6xOOjXFESPMXfl2hY6FFij',
  'https://lh3.googleusercontent.com/pw/AP1GczMigY0kr0rkA6HXFIT_J3ly_28X3PNVmVqEaPUFkGjgOOylaFOau5A9aFTfB2J_PscLim0ZjRtEweeLWjNf9c48toti5Snyi_vushVutDKAdBKaFanM',
  'https://lh3.googleusercontent.com/pw/AP1GczOUpDZsnzDB4C9StVyj_OBIUJP3EPkFym9wWXiM16m7CH2T_m5DUzAD3C-oJFF8ruO32Ade3iPl8bTr4EWqLHIQgnYbV2FvZdNjJH-7B-KcK-3zHK2r',
  'https://lh3.googleusercontent.com/pw/AP1GczOw4h3ydA-SP5q7IHFdRGVPepszuOTNVXA5CkHK8yg_aHAr1nccEbVtcLV2H-JHNDd1_kttdNwC5WU15R-uhErXVfsckxZVqEnyqW97hUDrmMdPJHYP',
  'https://lh3.googleusercontent.com/pw/AP1GczNQCAVf41x1eO8FGoWrk7n9_epOBzYfDz3JQT-PumKmCFTinUFxo_BOOGy1GUIqsM9VNENQk88loFjCN__6Z9MW5nsz2u-nHutTZnr93bJr8ZGLpr0R',
  'https://lh3.googleusercontent.com/pw/AP1GczPXawWUE7n2AewzGVHY8rbZJ791O2WcV_HrOTLuM_vaZAuP7rA2xuJ8fFbJvF8DWQl9zXxpoHbU626cgyfNfKVvGPg9ObQw4AXgOEw_MltUmkADfUCa',
  'https://lh3.googleusercontent.com/pw/AP1GczPsw3HBOw5xWlLQVfL5HLcMepMVfY-uLSJy1imV123CaGXtfUwN8b2FDNaklVfxW4fvbBsjaFsi42loziko2nLsXDJr616UPt6rpqDbgcB7q_HqZE-o',
  'https://lh3.googleusercontent.com/pw/AP1GczMKk8BsiE31kcthPtb3JSiUcsTUDB2OujuAflp5-aDwZ9WpCe9duLF9onp8A5jCogqRIZixbDvlQN7KnkDhrhT1BnU6t6GmnibkqMKW5uXsdwuRDCb2',
  'https://lh3.googleusercontent.com/pw/AP1GczNFBLrmETwAKNbrCw2NfEbsHykLNJNT0faG43sUTkV21jxdytUHdfaqqa6ljQp3OPQvVzCnvIsAwy7znNgLvPM4ghzAsa5RyNsQ3S9M2swQqHw248Tk',
  'https://lh3.googleusercontent.com/pw/AP1GczN3dSlSnE7N3moK0_JfDTxXO9n9Z5rGjI1VArN7sAwzSA3h2kpFLUheFwffBQr1yEisCA5jojZ6P09kn0b93or1MuMu5WCNUnPEZDWgcGi6T2k_H7jr',
  'https://lh3.googleusercontent.com/pw/AP1GczNhCeWUChFALumj16PyUlPMNw_KxV_O3O2j66Nen-H4ZDoqyfwYAvo8SmcRorMRSAX0ies9b6SM5IcGIjaO_UKDR8r1uDtURgCuwlCqE5GkMAnqxO1C',
  'https://lh3.googleusercontent.com/pw/AP1GczPfPQESI1nXDqWrat5Kp5-uJ5rgte2fPooZx0AcfTqYhdugSYL_bOqD5xj6qBuEZhARwDvSNCPg47ZOLlWXL_6R-Snzf5Hz7GUDFYGs9F1CIOcdKccD',
  'https://lh3.googleusercontent.com/pw/AP1GczNC4EMO7ePxaErADHE19ZyP4dbjjyohvbg4al6_SkObjU61w-fkWRZgZjWVLVUv7usslAzwUyTYwGuf-SYsUxZ6SvSMPK2Dzu-ak_T-ZJLohcFfHocr',
  'https://lh3.googleusercontent.com/pw/AP1GczPAKqqyxpAgXaILXvqsgM-TXQrED-NF_FGJ8WR2N9rV1b2Z6d5HOnwlp7BjwFrgfn4vRxk2yJMnPhwp9ethCtmGUbJkuof5FeMXUOfKfgW-KGWfWKtl',
  'https://lh3.googleusercontent.com/pw/AP1GczMg_cFNwLg4EF5WheL2iTW3vcDuHC2eh7CTD5xBJ231Jnql8f5ZOYP1WvOcSFm5JcQLF6IX3j8MupkWi4dNKa1kA2Zmtol1A-We6j-nHHuiigbaSbID',
  'https://lh3.googleusercontent.com/pw/AP1GczPnGCp9BMRZ7yNgr-K5DIPvpAZXEcdPymnKBqSyQF9Vs6NrfNQB7VQKPZHG2yH663cIghtMlrr5Bf24CnjO0i7Xcs3z-cqyeZzmmH1By4R2nmHC2B-y',
] as const;

const thumbnailSource = (source: string) => `${source}=w480-h360-c`;
const fullSource = (source: string) => `${source}=w1800-h1800`;

export class PlantDiaryGalleryController {
  private readonly panel = requireElement<HTMLElement>('#plant-diary-panel');
  private readonly gallery = requireElement<HTMLElement>('#plant-diary-gallery');
  private readonly closeButton = requireElement<HTMLButtonElement>('#plant-diary-close');
  private readonly lightbox = requireElement<HTMLDialogElement>('#plant-diary-lightbox');
  private readonly lightboxImage = requireElement<HTMLImageElement>('#plant-diary-lightbox-image');
  private readonly counter = requireElement<HTMLElement>('#plant-diary-lightbox-counter');
  private readonly lightboxClose = requireElement<HTMLButtonElement>('#plant-diary-lightbox-close');
  private readonly previousButton = requireElement<HTMLButtonElement>('#plant-diary-lightbox-previous');
  private readonly nextButton = requireElement<HTMLButtonElement>('#plant-diary-lightbox-next');
  private currentIndex = 0;

  constructor(private readonly onClose: () => void) {
    this.buildThumbnails();
    this.lightboxImage.referrerPolicy = 'no-referrer';
    this.closeButton.addEventListener('click', () => this.closePanel());
    this.lightboxClose.addEventListener('click', () => this.closeLightbox());
    this.previousButton.addEventListener('click', () => this.showImage(this.currentIndex - 1));
    this.nextButton.addEventListener('click', () => this.showImage(this.currentIndex + 1));
    this.lightbox.addEventListener('click', (event) => {
      if (event.target === this.lightbox) this.closeLightbox();
    });
    window.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  open(): void {
    this.panel.hidden = false;
    this.gallery.querySelector<HTMLButtonElement>('button')?.focus();
  }

  hide(): void {
    this.panel.hidden = true;
    if (this.lightbox.open) this.lightbox.close();
  }

  private buildThumbnails(): void {
    PLANT_DIARY_IMAGE_SOURCES.forEach((source, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `View plant diary image ${index + 1} full screen`);
      const image = document.createElement('img');
      image.src = thumbnailSource(source);
      image.alt = `Plant diary ${index + 1}`;
      image.loading = 'lazy';
      image.referrerPolicy = 'no-referrer';
      button.append(image);
      button.addEventListener('click', () => this.showImage(index));
      this.gallery.append(button);
    });
  }

  private showImage(index: number): void {
    this.currentIndex = (index + PLANT_DIARY_IMAGE_SOURCES.length) % PLANT_DIARY_IMAGE_SOURCES.length;
    this.lightboxImage.src = fullSource(PLANT_DIARY_IMAGE_SOURCES[this.currentIndex]!);
    this.lightboxImage.alt = `Plant diary ${this.currentIndex + 1}`;
    this.counter.textContent = `${this.currentIndex + 1} / ${PLANT_DIARY_IMAGE_SOURCES.length}`;
    if (!this.lightbox.open) this.lightbox.showModal();
  }

  private closeLightbox(): void {
    this.lightbox.close();
    this.gallery.querySelectorAll<HTMLButtonElement>('button')[this.currentIndex]?.focus();
  }

  private closePanel(): void {
    this.hide();
    this.onClose();
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (this.lightbox.open && event.code === 'ArrowLeft') {
      event.preventDefault();
      this.showImage(this.currentIndex - 1);
    } else if (this.lightbox.open && event.code === 'ArrowRight') {
      event.preventDefault();
      this.showImage(this.currentIndex + 1);
    } else if (event.code === 'Escape' && this.lightbox.open) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.closeLightbox();
    } else if (event.code === 'Escape' && !this.panel.hidden) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.closePanel();
    }
  }
}

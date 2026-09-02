import { requireElement } from './dom.js';

type DiaryLabFeature = 'diary' | 'experiments';

const PHONE_NUMBERS = new Set(['2026527772', '07815437754']);

export class DiaryLabFeatures {
  private readonly diaryPanel = requireElement<HTMLElement>('#diary-panel');
  private readonly unlockForm = requireElement<HTMLFormElement>('#diary-unlock-form');
  private readonly password = requireElement<HTMLInputElement>('#diary-password');
  private readonly unlockMessage = requireElement<HTMLElement>('#diary-unlock-message');
  private readonly diaryLink = requireElement<HTMLAnchorElement>('#diary-link');
  private readonly experimentsPanel = requireElement<HTMLElement>('#experiments-panel');
  private readonly lightbox = requireElement<HTMLDialogElement>('#experiment-lightbox');
  private readonly lightboxImage = requireElement<HTMLImageElement>('#experiment-lightbox-image');

  open(feature: DiaryLabFeature): void {
    if (feature === 'diary') {
      this.experimentsPanel.hidden = true;
      this.resetDiary();
      this.diaryPanel.hidden = false;
      this.password.focus();
      return;
    }
    this.diaryPanel.hidden = true;
    this.experimentsPanel.hidden = false;
  }

  hide(): void {
    this.diaryPanel.hidden = true;
    this.experimentsPanel.hidden = true;
    if (this.lightbox.open) this.lightbox.close();
    this.lightboxImage.removeAttribute('src');
    this.lightboxImage.alt = '';
    this.resetDiary();
  }

  closeLightbox(): boolean {
    if (!this.lightbox.open) return false;
    this.lightbox.close();
    return true;
  }

  bind(onOpen: (feature: DiaryLabFeature) => void, onClose: () => void): void {
    requireElement<HTMLButtonElement>('#noel-read-diary').addEventListener('click', () => onOpen('diary'));
    requireElement<HTMLButtonElement>('#noel-view-experiments').addEventListener('click', () => onOpen('experiments'));
    this.unlockForm.addEventListener('submit', (event) => this.unlockDiary(event));
    document.querySelectorAll<HTMLElement>('.internal-feature-close').forEach((button) => {
      button.addEventListener('click', onClose);
    });
    document.querySelectorAll<HTMLElement>('[data-experiment-src]').forEach((button) => {
      button.addEventListener('click', () => this.openExperimentImage(button));
    });
    requireElement<HTMLButtonElement>('#experiment-lightbox-close')
      .addEventListener('click', () => this.lightbox.close());
    this.lightbox.addEventListener('click', (event) => {
      if (event.target === this.lightbox) this.lightbox.close();
    });
  }

  private resetDiary(): void {
    this.unlockForm.reset();
    this.unlockMessage.textContent = '';
    this.unlockMessage.classList.remove('success');
    this.diaryLink.hidden = true;
  }

  private unlockDiary(event: SubmitEvent): void {
    event.preventDefault();
    const phoneNumber = this.password.value.replace(/\D/g, '');
    if (!PHONE_NUMBERS.has(phoneNumber)) {
      this.unlockMessage.textContent = "That isn't Max's phone number.";
      this.unlockMessage.classList.remove('success');
      this.diaryLink.hidden = true;
      this.password.select();
      return;
    }
    this.unlockMessage.textContent = 'Diary unlocked.';
    this.unlockMessage.classList.add('success');
    this.diaryLink.hidden = false;
    this.diaryLink.focus();
  }

  private openExperimentImage(button: HTMLElement): void {
    const source = button.dataset.experimentSrc;
    const thumbnail = button.querySelector<HTMLImageElement>('img');
    if (!source || !thumbnail) return;
    this.lightboxImage.src = source;
    this.lightboxImage.alt = thumbnail.alt;
    this.lightbox.showModal();
  }
}

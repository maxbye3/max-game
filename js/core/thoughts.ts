import { announceWorldInteraction } from './world-interactions.js';

const SUBMISSION_URL = 'https://formsubmit.co/ajax/botherandherobye@gmail.com';
let thoughtsDialog: HTMLDialogElement | null = null;
export const isThoughtsOpen = (): boolean => thoughtsDialog?.open ?? false;

export function setupThoughts(releaseInput: () => void): void {
  const toggle = document.querySelector<HTMLButtonElement>('#thoughts-toggle');
  if (!toggle) return;
  const dialog = document.createElement('dialog');
  dialog.id = 'thoughts-dialog';
  dialog.className = 'thoughts-dialog';
  dialog.setAttribute('aria-labelledby', 'thoughts-title');
  dialog.innerHTML = `
    <header class="thoughts-header">
      <h2 id="thoughts-title">Thoughts</h2>
      <button class="thoughts-close" type="button" aria-label="Close thoughts">×</button>
    </header>
    <p>Got an idea for the game? I'd love to hear it.</p>
    <form class="thoughts-form">
      <label for="thoughts-name">Name</label>
      <input id="thoughts-name" name="name" autocomplete="name" maxlength="100" required>
      <label for="thoughts-email">Email</label>
      <input id="thoughts-email" name="email" type="email" autocomplete="email" maxlength="254" required>
      <label for="thoughts-idea">Your idea</label>
      <textarea id="thoughts-idea" name="idea" rows="4" maxlength="5000" required></textarea>
      <div class="thoughts-honey" aria-hidden="true">
        <label for="thoughts-website">Leave this empty</label>
        <input id="thoughts-website" name="_honey" tabindex="-1" autocomplete="off">
      </div>
      <button class="thoughts-send" type="submit">Send idea</button>
      <p class="thoughts-status" role="status" aria-live="polite"></p>
    </form>`;
  document.body.append(dialog);
  thoughtsDialog = dialog;
  const form = dialog.querySelector<HTMLFormElement>('form')!;
  const name = dialog.querySelector<HTMLInputElement>('#thoughts-name')!;
  const email = dialog.querySelector<HTMLInputElement>('#thoughts-email')!;
  const idea = dialog.querySelector<HTMLTextAreaElement>('#thoughts-idea')!;
  const send = dialog.querySelector<HTMLButtonElement>('.thoughts-send')!;
  const status = dialog.querySelector<HTMLElement>('.thoughts-status')!;
  let submitting = false;

  toggle.addEventListener('click', () => {
    announceWorldInteraction();
    releaseInput();
    dialog.showModal();
    name.focus();
  });
  dialog.querySelector('.thoughts-close')!.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { releaseInput(); toggle.focus(); });
  // Typing WASD or using arrow keys in a field must never move the player.
  dialog.addEventListener('keydown', (event) => event.stopPropagation());
  dialog.addEventListener('keyup', (event) => event.stopPropagation());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submitting) return;
    name.value = name.value.trim();
    email.value = email.value.trim();
    idea.value = idea.value.trim();
    if (!form.reportValidity()) return;
    submitting = true;
    send.disabled = true;
    send.textContent = 'Sending…';
    status.textContent = '';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    const fields = new FormData(form);
    try {
      const response = await fetch(SUBMISSION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: fields.get('name'), email: fields.get('email'), idea: fields.get('idea'),
          _honey: fields.get('_honey'), _subject: "New idea for Max's Overworld", _template: 'table',
        }),
        signal: controller.signal,
      });
      const result = await response.json() as { success?: boolean | string };
      if (!response.ok || (result.success !== true && result.success !== 'true')) throw new Error('Submission was not accepted');
      form.reset();
      status.textContent = 'Thanks! Your idea has been submitted.';
    } catch {
      status.textContent = "Couldn't confirm your submission. Your idea is still here — please try again.";
    } finally {
      window.clearTimeout(timeout);
      submitting = false;
      send.disabled = false;
      send.textContent = 'Send idea';
    }
  });
}

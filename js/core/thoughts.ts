import { announceWorldInteraction } from './world-interactions.js';

const RECIPIENT = 'botherandherobye@gmail.com';
const SUBJECT = "New idea for Max's Overworld";
const SUBMISSION_URL = `https://formsubmit.co/ajax/${RECIPIENT}`;
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
      <a class="thoughts-email" hidden>Email idea instead</a>
    </form>`;
  document.body.append(dialog);
  thoughtsDialog = dialog;
  const form = dialog.querySelector<HTMLFormElement>('form')!;
  const name = dialog.querySelector<HTMLInputElement>('#thoughts-name')!;
  const email = dialog.querySelector<HTMLInputElement>('#thoughts-email')!;
  const idea = dialog.querySelector<HTMLTextAreaElement>('#thoughts-idea')!;
  const send = dialog.querySelector<HTMLButtonElement>('.thoughts-send')!;
  const status = dialog.querySelector<HTMLElement>('.thoughts-status')!;
  const emailInstead = dialog.querySelector<HTMLAnchorElement>('.thoughts-email')!;
  let submitting = false;

  const updateEmailLink = (): void => {
    const body = `Name: ${name.value}\nEmail: ${email.value}\n\n${idea.value}`;
    emailInstead.href = `mailto:${RECIPIENT}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(body)}`;
  };
  form.addEventListener('input', updateEmailLink);

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
    emailInstead.hidden = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    const fields = new FormData(form);
    try {
      const response = await fetch(SUBMISSION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: fields.get('name'), email: fields.get('email'), idea: fields.get('idea'),
          _honey: fields.get('_honey'), _subject: SUBJECT, _template: 'table',
          _url: window.location.href,
        }),
        signal: controller.signal,
      });
      const result = await response.json() as { success?: boolean | string; message?: string };
      // Activation responses can be HTTP 200 without accepting an idea for delivery.
      if (typeof result.message === 'string' && /activat|confirm.{0,40}email/i.test(result.message)) {
        status.textContent = "Idea delivery isn't ready yet: the game owner needs to activate the form by email. Your idea is still here — you can email it instead.";
        updateEmailLink();
        emailInstead.hidden = false;
        return;
      }
      if (!response.ok || (result.success !== true && result.success !== 'true')) {
        const detail = typeof result.message === 'string' ? result.message.trim().slice(0, 300) : '';
        status.textContent = `Couldn't confirm your submission.${detail ? ` ${detail}` : ''} Your idea is still here — try again or email it instead.`;
        updateEmailLink();
        emailInstead.hidden = false;
        return;
      }
      form.reset();
      status.textContent = 'Thanks! Your idea has been submitted.';
    } catch {
      status.textContent = "Couldn't confirm your submission. Your idea is still here — try again or email it instead.";
      updateEmailLink();
      emailInstead.hidden = false;
    } finally {
      window.clearTimeout(timeout);
      submitting = false;
      send.disabled = false;
      send.textContent = 'Send idea';
    }
  });
}

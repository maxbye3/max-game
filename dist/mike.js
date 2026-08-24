import { requireElement } from './dom.js';
import { MIKE_DIALOGUE_LINES } from './mike-dialogue.js';
import { hasVisitedInternalTest } from './world-state.js';
const MIKE_FOLDER = 'chat/mike';
const MIKE_NAME = MIKE_FOLDER.slice(MIKE_FOLDER.lastIndexOf('/') + 1);
const INTERACTION_DISTANCE = 56;
const COLLISION_DISTANCE = 27;
export const MIKE = {
    x: 300,
    y: 685,
    width: 40,
    height: 46,
};
const talkButton = requireElement('#mike-talk');
const dialogue = requireElement('#mike-dialogue');
const speaker = requireElement('#mike-speaker');
const dialogueLine = requireElement('#mike-dialogue-line');
const closeButton = requireElement('#mike-dialogue-close');
const theme = new Audio('chat/mike/example_character/theme.mp3');
theme.preload = 'auto';
let nearby = false;
let dialogueOpen = false;
let conversationIndex = 0;
export const isMikeDialogueOpen = () => dialogueOpen;
export const isMikeAftermathActive = () => hasVisitedInternalTest();
export function playerCollidesWithMike(x, y) {
    if (isMikeAftermathActive())
        return false;
    return Math.hypot(x - MIKE.x, y - MIKE.y) < COLLISION_DISTANCE;
}
function closeDialogue() {
    dialogueOpen = false;
    dialogue.hidden = true;
    theme.pause();
    theme.currentTime = 0;
    talkButton.hidden = !nearby;
}
function startDialogue() {
    if (!nearby || dialogueOpen)
        return;
    dialogueOpen = true;
    speaker.textContent = MIKE_NAME;
    dialogueLine.textContent = MIKE_DIALOGUE_LINES[conversationIndex % MIKE_DIALOGUE_LINES.length] ?? '';
    conversationIndex += 1;
    dialogue.hidden = false;
    talkButton.hidden = true;
    theme.pause();
    theme.currentTime = 0;
    void theme.play().catch(() => {
        // Browsers may reject audio until a real keyboard or pointer gesture.
    });
}
export function updateMikeInteraction(playerX, playerY) {
    if (isMikeAftermathActive()) {
        nearby = false;
        talkButton.hidden = true;
        return;
    }
    const nextNearby = Math.hypot(playerX - MIKE.x, playerY - MIKE.y) <= INTERACTION_DISTANCE;
    if (nextNearby === nearby)
        return;
    nearby = nextNearby;
    talkButton.hidden = !nearby || dialogueOpen;
}
export function setupMike() {
    if (isMikeAftermathActive()) {
        talkButton.hidden = true;
        return;
    }
    talkButton.addEventListener('click', startDialogue);
    closeButton.addEventListener('click', closeDialogue);
    window.addEventListener('keydown', (event) => {
        if (event.code === 'Escape' && dialogueOpen) {
            event.preventDefault();
            closeDialogue();
            return;
        }
        if ((event.code === 'KeyE' || event.code === 'Enter' || event.code === 'Space') && nearby) {
            event.preventDefault();
            startDialogue();
        }
    });
}
//# sourceMappingURL=mike.js.map
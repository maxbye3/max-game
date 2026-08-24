const INTERNAL_TEST_VISITED_KEY = 'max-game:internal-test-visited';
const NIALL_FIGHT_COMPLETE_KEY = 'max-game:niall-fight-complete';
export function hasVisitedInternalTest() {
    try {
        return window.localStorage.getItem(INTERNAL_TEST_VISITED_KEY) === 'true';
    }
    catch {
        return false;
    }
}
export function markInternalTestVisited() {
    try {
        window.localStorage.setItem(INTERNAL_TEST_VISITED_KEY, 'true');
    }
    catch {
        // The game still works when storage is unavailable (for example, a locked-down file URL).
    }
}
export function hasCompletedNiallFight() {
    try {
        return window.localStorage.getItem(NIALL_FIGHT_COMPLETE_KEY) === 'true';
    }
    catch {
        return false;
    }
}
export function markNiallFightComplete() {
    try {
        window.localStorage.setItem(NIALL_FIGHT_COMPLETE_KEY, 'true');
    }
    catch {
        // The follow state is a bonus; the battle page still works without storage.
    }
}
//# sourceMappingURL=world-state.js.map
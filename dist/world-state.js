const INTERNAL_TEST_VISITED_KEY = 'max-game:internal-test-visited';
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
//# sourceMappingURL=world-state.js.map
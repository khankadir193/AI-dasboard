export function makeId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function buildFirstPromptTitle(prompt) {
    const p = (prompt || '').toString();
    return p.length > 50 ? `${p.slice(0, 50)}…` : p;
}

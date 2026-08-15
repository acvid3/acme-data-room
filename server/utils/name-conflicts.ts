export function basenameWithoutExtension(name: string): { stem: string; extension: string } {
    const dot = name.lastIndexOf('.');
    if (dot <= 0) {
        return { stem: name, extension: '' };
    }
    return { stem: name.slice(0, dot), extension: name.slice(dot) };
}

export function nextAvailableName(name: string, taken: Set<string>): string {
    const { stem, extension } = basenameWithoutExtension(name);
    if (!taken.has(name)) {
        return name;
    }
    let counter = 1;
    let candidate = `${stem} (${counter})${extension}`;
    while (taken.has(candidate)) {
        counter += 1;
        candidate = `${stem} (${counter})${extension}`;
    }
    return candidate;
}

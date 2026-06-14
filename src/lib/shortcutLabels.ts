export function isMacPlatform(platform = navigator.platform): boolean {
  return /Mac|iPhone|iPad|iPod/i.test(platform);
}

export function shortcutLabel(key: string, platform = navigator.platform): string {
  return `${isMacPlatform(platform) ? "⌘" : "Ctrl+"}${key.toUpperCase()}`;
}

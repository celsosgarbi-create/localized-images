/** Resolves the Figma token: UI/store value takes precedence, env var as fallback. */
export function getEffectiveToken(storeToken: string): string {
  return storeToken || (import.meta.env.VITE_FIGMA_TOKEN as string) || '';
}

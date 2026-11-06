/**
 * Text safe to put inside a CSS string, e.g. `content:` in an @page footer.
 * Business names are user input: quotes, backslashes and angle brackets are
 * escaped so they can't end the string or the <style> element.
 */
export function cssString(value: string): string {
  return `"${value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/[\r\n]+/g, " ")
    .replace(/</g, "\\3c ")
    .replace(/>/g, "\\3e ")}"`;
}

export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (whole, key) => (key in vars ? String(vars[key]) : whole))
}

export function marked(text: string): { text: string; bold: boolean }[] {
  return text
    .split(/\*\*/)
    .map((piece, index) => ({ text: piece, bold: index % 2 === 1 }))
    .filter((piece) => piece.text !== '')
}

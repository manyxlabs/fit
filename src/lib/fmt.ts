/** `min` below `digits` drops trailing zeros: fmt(60, 2, 0) is "60", fmt(62.5, 2, 0) is "62.5". */
export const fmt = (n: number, digits = 0, min = digits) => n.toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: min });

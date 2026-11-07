export const fmt = (n: number, digits = 0) => n.toLocaleString('en-IN', { maximumFractionDigits: digits, minimumFractionDigits: digits });

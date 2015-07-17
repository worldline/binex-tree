export const PI = Math.PI;

export function add(a, ...b) {
  return a + b.reduce((sum, n) => sum + n);
}

export function sub(a, ...b) {
  return a - b.reduce((sum, n) => sum - n);
}

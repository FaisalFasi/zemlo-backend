import { randomUUID } from 'crypto';

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const randomPart = randomUUID().slice(0, 8).toUpperCase();

  return `ZEMLO-${year}-${randomPart}`;
}

import type { Prisma } from '@prisma/client';

type DecimalLike = Prisma.Decimal | number | string;

export function toNumber(value: DecimalLike): number {
  return Number(value);
}

export function toNullableNumber(
  value: DecimalLike | null | undefined,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

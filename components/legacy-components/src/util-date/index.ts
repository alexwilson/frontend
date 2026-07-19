import { format } from "date-fns"

export const utcDate = (value: string | number | Date): Date => {
  const d = new Date(value)
  return new Date(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds(),
  )
}

export const formatUTC = (value: string | number | Date, pattern: string): string =>
  format(utcDate(value), pattern)

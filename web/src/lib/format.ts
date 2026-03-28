export const priceFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 2,
});

export const wholeNumberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

export const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

export function formatDateTime(value: string | null) {
  if (!value) {
    return 'No data';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'No data' : date.toLocaleString();
}

export function formatCurrency(value: number | null) {
  if (value === null) {
    return 'N/A';
  }

  return `$${priceFormatter.format(value)}`;
}

export function formatCompactValue(value: number | null) {
  if (value === null) {
    return 'N/A';
  }

  return compactFormatter.format(value);
}

export function formatSignedPercent(value: number | null) {
  if (value === null) {
    return 'N/A';
  }

  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export function formatSignedValue(value: number | null) {
  if (value === null) {
    return 'N/A';
  }

  const prefix = value > 0 ? '+' : '';
  return `${prefix}${priceFormatter.format(value)}`;
}

export function valueTone(value: number | null) {
  if (value === null || value === 0) {
    return 'text-stone-700';
  }

  return value > 0 ? 'text-emerald-600' : 'text-rose-600';
}

export function toneForStatus(status: string) {
  if (status === 'success') {
    return 'success';
  }

  if (status === 'warning') {
    return 'warning';
  }

  return 'danger';
}

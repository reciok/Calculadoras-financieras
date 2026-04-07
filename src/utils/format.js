export function formatCurrency(value) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value) {
  return `${(Number.isFinite(value) ? value : 0).toFixed(2)}%`;
}

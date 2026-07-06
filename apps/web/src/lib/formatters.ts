export function titleize(value: string | null | undefined) {
  if (!value) return "Not available";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatInr(value: number | null | undefined) {
  if (value == null) return "Not available";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatPercent(value: number | null | undefined, digits = 0) {
  if (value == null) return "Not available";
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

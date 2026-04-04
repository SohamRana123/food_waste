export function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short"
  });
}

export function formatCurrency(value: number | undefined) {
  if (value === undefined) {
    return "n/a";
  }
  return `INR ${value.toFixed(0)}`;
}

export function formatPercent(value: number | undefined, digits = 1) {
  if (value === undefined) {
    return "n/a";
  }
  return `${value.toFixed(digits)}%`;
}

/** Shorten long model names for chart axis labels */
export function formatModelTick(name: string) {
  if (name.length <= 14) {
    return name;
  }
  return `${name.slice(0, 12)}…`;
}

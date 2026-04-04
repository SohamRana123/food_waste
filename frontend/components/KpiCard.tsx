import { useEffect, useState } from "react";

type KpiCardProps = {
  label: string;
  value: string;
  caption: string;
  tone?: "warm" | "cool" | "earth";
};

export default function KpiCard({
  label,
  value,
  caption,
  tone = "warm"
}: KpiCardProps) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  return (
    <article className={`kpi-card tone-${tone}`}>
      <span className="kpi-label">{label}</span>
      <strong className="kpi-value">{displayValue}</strong>
      <p className="kpi-caption">{caption}</p>
    </article>
  );
}


type ChartEmptyStateProps = {
  title?: string;
  message: string;
};

export default function ChartEmptyState({
  title = "No chart data",
  message
}: ChartEmptyStateProps) {
  return (
    <div className="chart-empty" role="status">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}

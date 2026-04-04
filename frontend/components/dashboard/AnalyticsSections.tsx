import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import ChartEmptyState from "../ChartEmptyState";
import SectionCard from "../SectionCard";
import type { MetricsResponse, ModelMetric } from "../../types/dashboard";
import { formatModelTick } from "../../lib/formatters";

type SeriesRow = { model: string; rmse: number; weeklyRmse: number };
type DemandRow = { date: string; actual: number; predicted: number };
type WasteRow = { date: string; baselineWaste: number; optimizedWaste: number };
type MonitorRow = { date: string; rmse: number; wasteReduction: number };

type ModelProps = {
  metrics: MetricsResponse | null;
  comparisonSeries: SeriesRow[];
  metricsAvailable: boolean;
};

export function ModelComparisonSection({
  metrics,
  comparisonSeries,
  metricsAvailable
}: ModelProps) {
  const modelRows = metrics?.model_comparison ?? [];

  return (
    <SectionCard
      title="Model Comparison"
      subtitle="Random Forest, XGBoost, LightGBM, Ridge, validation-weighted ensemble, and TFT challenger."
    >
      <div className="chart-shell">
        {comparisonSeries.length === 0 ? (
          <ChartEmptyState
            message={
              metricsAvailable
                ? "Model comparison table is empty. Run training to populate metrics."
                : "Load metrics after training completes to compare candidate models."
            }
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonSeries} margin={{ bottom: 8, left: 4, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="model"
                interval={0}
                tick={{ fontSize: 11 }}
                tickFormatter={formatModelTick}
                angle={-28}
                textAnchor="end"
                height={72}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="rmse" fill="#b6532d" name="Next-day RMSE" />
              <Bar dataKey="weeklyRmse" fill="#1f5b50" name="Weekly RMSE" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>RMSE</th>
              <th>MAE</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {modelRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-empty-cell">
                  No model comparison rows yet. Use <strong>Run /train</strong> after the API finishes
                  startup training.
                </td>
              </tr>
            ) : (
              modelRows.map((row: ModelMetric) => (
                <tr key={row.model_name}>
                  <td>{row.model_name}</td>
                  <td>{row.rmse.toFixed(1)}</td>
                  <td>{row.mae.toFixed(1)}</td>
                  <td>{row.selected_model ? "Production" : "Challenger"}</td>
                  <td>{row.notes || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

type DemandProps = {
  demandSeries: DemandRow[];
  wasteSeries: WasteRow[];
  historyHasForecastRows: boolean;
};

export function DemandWasteSection({
  demandSeries,
  wasteSeries,
  historyHasForecastRows
}: DemandProps) {
  return (
    <SectionCard
      title="Demand and Waste"
      subtitle="Recent total demand, predicted demand, and waste delta across the kitchen network."
    >
      <div className="chart-shell">
        {demandSeries.length === 0 ? (
          <ChartEmptyState
            message={
              historyHasForecastRows
                ? "Forecast history rows exist but could not be aggregated for this view."
                : "No forecast history yet. Train the production model and ensure backtests are logged."
            }
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={demandSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke="#183a37" strokeWidth={2.5} />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#b6532d"
                strokeWidth={2.2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="chart-shell compact-chart">
        {wasteSeries.length === 0 ? (
          <ChartEmptyState
            title="No waste series"
            message="Waste comparison needs historical forecast rows with waste fields."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wasteSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="baselineWaste" fill="#d39c3d" name="Historical waste" />
              <Bar dataKey="optimizedWaste" fill="#1f5b50" name="Optimized waste" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </SectionCard>
  );
}

type MonitorProps = { monitoringSeries: MonitorRow[] };

export function MonitoringSection({ monitoringSeries }: MonitorProps) {
  return (
    <SectionCard
      title="Monitoring Loop"
      subtitle="Nightly retraining history and error drift across successive runs."
    >
      <div className="chart-shell">
        {monitoringSeries.length === 0 ? (
          <ChartEmptyState message="Monitoring log is empty until at least one training run writes metrics to the monitoring CSV." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monitoringSeries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="rmse" stroke="#b6532d" strokeWidth={2.2} />
              <Line
                type="monotone"
                dataKey="wasteReduction"
                stroke="#1f5b50"
                strokeWidth={2.2}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </SectionCard>
  );
}

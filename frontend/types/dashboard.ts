export type Kitchen = {
  kitchen_id: string;
  hostel_name: string;
  campus_zone: string;
  capacity: number;
  capacity_band: string;
};

export type ModelMetric = {
  model_name: string;
  model_version: string;
  rmse: number;
  mae: number;
  weekly_rmse: number;
  weekly_mae: number;
  interval_coverage: number;
  residual_std: number;
  mean_prediction_jump: number;
  selected_model: boolean;
  promoted: boolean;
  improvement_pct: number;
  notes?: string;
};

export type MetricComparisonRow = {
  metric: string;
  before_value: number;
  after_value: number;
  unit: string;
};

export type CoverageMetrics = {
  expected_coverage_pct: number;
  actual_coverage_pct: number;
  calibration_gap_pct: number;
};

export type ServiceLevelMetrics = {
  target_service_level_pct: number;
  target_max_shortage_probability_pct: number;
  planned_shortage_probability_pct: number;
  realized_shortage_rate_pct: number;
};

export type FeatureImportancePoint = {
  feature: string;
  importance: number;
};

export type DriverPoint = {
  driver: string;
  importance: number;
};

export type MetricsResponse = {
  current_model: string | null;
  trained_at: string;
  selected_model_version: string | null;
  model_comparison: ModelMetric[];
  business_metrics: {
    waste_reduction_pct?: number;
    daily_cost_savings_inr?: number;
    annual_savings_inr?: number;
    optimized_waste_pct?: number;
    prediction_interval_coverage?: number;
    before_after_table?: MetricComparisonRow[];
    coverage_metrics?: CoverageMetrics;
    service_level_metrics?: ServiceLevelMetrics;
  };
  before_after_table: MetricComparisonRow[];
  coverage_metrics: CoverageMetrics;
  service_level_metrics: ServiceLevelMetrics;
  feature_importance: FeatureImportancePoint[];
  top_drivers: DriverPoint[];
  monitoring: {
    timestamp: string;
    current_model: string;
    rmse: number;
    mae: number;
    waste_reduction_pct: number;
    annual_savings_inr: number;
  }[];
  plot_urls: Record<string, string>;
};

export type HistoryPoint = {
  kitchen_id: string;
  date: string;
  actual_demand: number;
  predicted_demand: number;
  baseline_waste_realized: number;
  optimized_waste_realized: number;
  daily_cost_saving_inr: number;
};

export type HistoryResponse = {
  forecast_history: HistoryPoint[];
  model_comparison: ModelMetric[];
  latest_predictions: {
    kitchen_id: string;
    forecast_date: string;
    point_forecast: number;
    model_name: string;
  }[];
  latest_training_runs: ModelMetric[];
  feature_importance: FeatureImportancePoint[];
  top_drivers: DriverPoint[];
  plot_urls: Record<string, string>;
};

export type PredictionResponse = {
  prediction_id: string;
  kitchen_id: string;
  selected_model: string;
  model_version: string;
  winner_reason: string;
  forecasts: {
    date: string;
    horizon_day: number;
    predicted_demand: number;
    lower_bound: number;
    upper_bound: number;
    sigma: number;
    menu_type: string;
  }[];
  next_day_optimization: {
    forecast_date: string;
    predicted_demand: number;
    optimal_quantity: number;
    expected_waste: number;
    expected_shortage: number;
    expected_cost: number;
    critical_ratio: number;
    shortage_probability_pct: number;
    service_level_target_pct: number;
    service_level_satisfied: boolean;
  };
  decision_comparison: {
    baseline: DecisionStrategy;
    optimized: DecisionStrategy;
    expected_cost_savings: number;
    expected_waste_reduction_pct: number;
  };
  scenario_analysis: ScenarioPoint[];
  ingredient_plan: {
    ingredient_name: string;
    unit: string;
    total_quantity: number;
  }[];
  explanation?: {
    explanation_method?: string;
    why_summary?: string;
    local_feature_attributions?: { feature: string; value: number }[];
    tft_attention?: { available?: boolean; note?: string };
    error?: string;
  };
};

export type DecisionStrategy = {
  strategy_name: string;
  quantity: number;
  expected_waste: number;
  expected_shortage: number;
  expected_cost: number;
  shortage_probability_pct: number;
  service_level_target_pct: number;
  service_level_satisfied: boolean;
  critical_ratio: number;
};

export type ScenarioPoint = {
  scenario_name: string;
  attendance_multiplier: number;
  predicted_demand: number;
  optimized_quantity: number;
  optimized_waste: number;
  optimized_cost: number;
  heuristic_quantity: number;
  heuristic_waste: number;
  heuristic_cost: number;
};

export type ForecastFormState = {
  kitchenId: string;
  forecastStartDate: string;
  horizonDays: "1" | "7";
  menuType: string;
  temperature: string;
  rainfall: string;
  attendanceVariation: string;
  isHoliday: boolean;
  isExamWeek: boolean;
  isEventDay: boolean;
};

export type FeedbackFormState = {
  kitchenId: string;
  date: string;
  actualDemand: string;
  preparedQuantity: string;
  wasteQuantity: string;
  menuType: string;
  temperature: string;
  rainfall: string;
};

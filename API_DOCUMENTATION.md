# API Documentation

Kitchen Demand Command Center REST API Reference

**Base URL**: `http://localhost:8000` (development) or `https://api.kitchen-api.com` (production)

**API Version**: 2.0

---

## Table of Contents

1. [Authentication](#authentication)
2. [Error Handling](#error-handling)
3. [Core Endpoints](#core-endpoints)
4. [Data Models](#data-models)
5. [Examples](#examples)
6. [Rate Limiting](#rate-limiting)

---

## Authentication

Currently, the API is open (no authentication required for the hackathon demo). In production, Bearer token authentication will be required.

### Future: Bearer Token

```
Authorization: Bearer YOUR_API_KEY
```

---

## Error Handling

All errors follow this format:

```json
{
  "detail": "Error message describing what went wrong",
  "status_code": 400,
  "timestamp": "2024-04-04T12:00:00Z",
  "request_id": "req-123-abc"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource doesn't exist |
| 422 | Validation Error - Input validation failed |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Temporary unavailability |

---

## Core Endpoints

### Health Check

#### `GET /health`

Check API health status.

**Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2024-04-04T12:00:00Z",
  "version": "2.0.0",
  "database": "connected",
  "uptime_seconds": 3600
}
```

---

### Kitchen Operations

#### `GET /kitchens`

List all registered kitchens.

**Response** (200 OK):
```json
[
  {
    "kitchen_id": "K1",
    "hostel_name": "North Hostel",
    "campus_zone": "A1",
    "latitude": 22.5726,
    "longitude": 88.3639,
    "capacity": 500,
    "capacity_band": "large"
  },
  {
    "kitchen_id": "K2",
    "hostel_name": "South Hostel",
    "campus_zone": "B2",
    "latitude": 22.5650,
    "longitude": 88.3700,
    "capacity": 300,
    "capacity_band": "medium"
  }
]
```

---

### Demand Forecasting

#### `POST /predict`

Generate demand forecast with optimization recommendation.

**Request**:
```json
{
  "kitchen_id": "K1",
  "forecast_start_date": "2024-04-05",
  "horizon_days": 7,
  "future_context": [
    {
      "date": "2024-04-05",
      "menu_type": "regular",
      "temperature": 32.5,
      "rainfall": 0.0,
      "attendance_variation": 0.0,
      "is_holiday": false,
      "is_exam_week": false,
      "is_event_day": false
    },
    {
      "date": "2024-04-06",
      "menu_type": "protein_rich",
      "temperature": 31.8,
      "rainfall": 5.0,
      "attendance_variation": 0.1,
      "is_holiday": false,
      "is_exam_week": false,
      "is_event_day": false
    }
  ]
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| kitchen_id | string | Yes | Kitchen identifier (e.g., "K1") |
| forecast_start_date | date | Yes | Start date (YYYY-MM-DD) |
| horizon_days | integer | Yes | 1 or 7 days ahead |
| future_context | array | Yes | Array of context objects for each day |

**Context Object Fields**:

| Field | Type | Range | Description |
|-------|------|-------|-------------|
| date | date | YYYY-MM-DD | Day of forecast |
| menu_type | string | see below | Type of menu |
| temperature | number | -10 to 45 | Temperature in Celsius |
| rainfall | number | 0 to 500 | Rainfall in millimeters |
| attendance_variation | number | -0.5 to 0.5 | Variation multiplier |
| is_holiday | boolean | true/false | Holiday flag |
| is_exam_week | boolean | true/false | Exam week flag |
| is_event_day | boolean | true/false | Special event flag |

**Menu Types**:
- `regular`: Standard meal
- `protein_rich`: High protein content
- `regional_special`: Regional cuisine
- `comfort_food`: Comfort meals
- `festive`: Festival meals
- `light_weekend`: Weekend light meals

**Response** (200 OK):
```json
{
  "prediction_id": "pred-abc123def456",
  "kitchen_id": "K1",
  "selected_model": "xgboost",
  "model_version": "20240404_v2",
  "winner_reason": "Lowest next-day RMSE (28.3 meals)",
  "forecasts": [
    {
      "date": "2024-04-05",
      "horizon_day": 1,
      "predicted_demand": 1620,
      "lower_bound": 1520,
      "upper_bound": 1720,
      "sigma": 50.0,
      "menu_type": "regular"
    },
    {
      "date": "2024-04-06",
      "horizon_day": 2,
      "predicted_demand": 1680,
      "lower_bound": 1570,
      "upper_bound": 1790,
      "sigma": 53.5,
      "menu_type": "protein_rich"
    }
  ],
  "next_day_optimization": {
    "forecast_date": "2024-04-05",
    "predicted_demand": 1620,
    "optimal_quantity": 1685,
    "expected_waste": 45.2,
    "expected_shortage": 12.8,
    "expected_cost": 2150.0,
    "critical_ratio": 0.833,
    "shortage_probability_pct": 4.5,
    "service_level_target_pct": 95.0,
    "service_level_satisfied": true
  },
  "decision_comparison": {
    "baseline": {
      "strategy_name": "heuristic_1.25x",
      "quantity": 2025,
      "expected_waste": 405.0,
      "expected_shortage": 0.0,
      "expected_cost": 8100.0,
      "shortage_probability_pct": 0.0,
      "service_level_target_pct": 95.0,
      "service_level_satisfied": true,
      "critical_ratio": 0.833
    },
    "optimized": {
      "strategy_name": "newsvendor_optimal",
      "quantity": 1685,
      "expected_waste": 45.2,
      "expected_shortage": 12.8,
      "expected_cost": 2150.0,
      "shortage_probability_pct": 4.5,
      "service_level_target_pct": 95.0,
      "service_level_satisfied": true,
      "critical_ratio": 0.833
    },
    "expected_cost_savings": 5950.0,
    "expected_waste_reduction_pct": 88.8
  },
  "scenario_analysis": [
    {
      "scenario_name": "attendance_drop_20pct",
      "attendance_multiplier": 0.8,
      "predicted_demand": 1296,
      "optimized_quantity": 1351,
      "optimized_waste": 32.1,
      "optimized_cost": 1650.0,
      "heuristic_quantity": 1620,
      "heuristic_waste": 324.0,
      "heuristic_cost": 6480.0
    },
    {
      "scenario_name": "extreme_weather",
      "attendance_multiplier": 0.9,
      "predicted_demand": 1458,
      "optimized_quantity": 1523,
      "optimized_waste": 41.5,
      "optimized_cost": 1960.0,
      "heuristic_quantity": 1823,
      "heuristic_waste": 365.0,
      "heuristic_cost": 7300.0
    }
  ],
  "ingredient_plan": [
    {
      "ingredient_name": "Rice",
      "unit": "kg",
      "total_quantity": 285.0
    },
    {
      "ingredient_name": "Chicken",
      "unit": "kg",
      "total_quantity": 125.5
    },
    {
      "ingredient_name": "Vegetables",
      "unit": "kg",
      "total_quantity": 210.0
    }
  ],
  "explanation": {
    "explanation_method": "SHAP",
    "why_summary": "Lagged demand is the strongest signal (contribution: +45 meals). Menu type (regular) is neutral. Exam week flag is not active.",
    "local_feature_attributions": [
      {
        "feature": "lag_1",
        "value": 45.2
      },
      {
        "feature": "lag_7",
        "value": 28.5
      },
      {
        "feature": "menu_type_regular",
        "value": 0.0
      }
    ],
    "tft_attention": {
      "available": false,
      "note": "TFT model not selected for this prediction"
    }
  }
}
```

---

### Model Training & Management

#### `POST /train`

Trigger retraining of all candidate models.

**Request**: (no body required)

**Response** (200 OK):
```json
{
  "training_completed": true,
  "started_at": "2024-04-04T12:00:00Z",
  "completed_at": "2024-04-04T12:10:30Z",
  "duration_seconds": 630,
  "model_comparison": [
    {
      "model_name": "random_forest",
      "model_version": "20240404_v2",
      "rmse": 31.2,
      "mae": 24.5,
      "weekly_rmse": 68.3,
      "weekly_mae": 52.1,
      "interval_coverage": 0.92,
      "residual_std": 29.8,
      "mean_prediction_jump": 8.5,
      "selected_model": false,
      "promoted": false,
      "improvement_pct": -0.5,
      "notes": "Slightly worse RMSE than incumbent"
    },
    {
      "model_name": "xgboost",
      "model_version": "20240404_v2",
      "rmse": 28.3,
      "mae": 22.1,
      "weekly_rmse": 65.2,
      "weekly_mae": 50.3,
      "interval_coverage": 0.94,
      "residual_std": 27.5,
      "mean_prediction_jump": 7.2,
      "selected_model": true,
      "promoted": false,
      "improvement_pct": 0.0,
      "notes": "Incumbent XGBoost, stable"
    },
    {
      "model_name": "lightgbm",
      "model_version": "20240404_v2",
      "rmse": 29.1,
      "mae": 23.2,
      "weekly_rmse": 66.5,
      "weekly_mae": 51.2,
      "interval_coverage": 0.93,
      "residual_std": 28.2,
      "mean_prediction_jump": 8.1,
      "selected_model": false,
      "promoted": false,
      "improvement_pct": -2.8,
      "notes": "Worse than XGBoost"
    },
    {
      "model_name": "temporal_fusion_transformer",
      "model_version": "20240404_v2",
      "rmse": 32.5,
      "mae": 25.8,
      "weekly_rmse": 70.1,
      "weekly_mae": 54.5,
      "interval_coverage": 0.91,
      "residual_std": 31.2,
      "mean_prediction_jump": 12.3,
      "selected_model": false,
      "promoted": false,
      "improvement_pct": -14.8,
      "notes": "Training incomplete, falling back"
    }
  ],
  "winner": "xgboost",
  "promotion_occurred": false,
  "promotion_reason": "Challenger RMSE improvement < 1% threshold"
}
```

---

### Feedback & Monitoring

#### `POST /feedback`

Log actual demand and waste for model retraining.

**Request**:
```json
{
  "kitchen_id": "K1",
  "date": "2024-04-04",
  "actual_demand": 1580,
  "prepared_quantity": 1650,
  "waste_quantity": 70.0,
  "menu_type": "regular",
  "temperature": 31.0,
  "rainfall": 5.0
}
```

**Parameters**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| kitchen_id | string | Yes | Kitchen identifier |
| date | date | Yes | Service date (YYYY-MM-DD) |
| actual_demand | integer | Yes | Actual number of meals served |
| prepared_quantity | integer | Yes | Total meals prepared |
| waste_quantity | number | Yes | Meals wasted |
| menu_type | string | No | Menu type served |
| temperature | number | No | Actual temperature |
| rainfall | number | No | Actual rainfall |

**Response** (200 OK):
```json
{
  "logged_at": "2024-04-04T18:00:00Z",
  "kitchen_id": "K1",
  "date": "2024-04-04",
  "actual_demand": 1580,
  "prepared_quantity": 1650,
  "waste_quantity": 70.0,
  "shortage_quantity": 0.0,
  "waste_percentage": 4.2,
  "shortage_percentage": 0.0,
  "realized_cost": 1400.0,
  "next_retraining": "2024-04-05T02:00:00Z"
}
```

#### `GET /metrics`

Retrieve system metrics and business impact.

**Query Parameters**: (optional)
- `kitchen_id`: Filter by specific kitchen
- `days`: Last N days (default: 60)

**Response** (200 OK):
```json
{
  "current_model": "xgboost",
  "trained_at": "2024-04-04T12:10:30Z",
  "selected_model_version": "20240404_v2",
  "model_comparison": [
    {
      "model_name": "xgboost",
      "rmse": 28.3,
      "mae": 22.1,
      "selected_model": true,
      "promoted": false
    }
  ],
  "business_metrics": {
    "waste_reduction_pct": 22.3,
    "daily_cost_savings_inr": 1250.0,
    "annual_savings_inr": 456250.0,
    "optimized_waste_pct": 3.2,
    "prediction_interval_coverage": 0.94
  },
  "before_after_table": [
    {
      "metric": "Daily Waste (meals)",
      "before_value": 185.0,
      "after_value": 64.0,
      "unit": "meals"
    },
    {
      "metric": "Daily Cost per Meal",
      "before_value": 52.5,
      "after_value": 42.3,
      "unit": "INR"
    }
  ],
  "coverage_metrics": {
    "expected_coverage_pct": 95.0,
    "actual_coverage_pct": 94.0,
    "calibration_gap_pct": 1.0
  },
  "service_level_metrics": {
    "target_service_level_pct": 95.0,
    "target_max_shortage_probability_pct": 5.0,
    "planned_shortage_probability_pct": 4.2,
    "realized_shortage_rate_pct": 0.8
  },
  "feature_importance": [
    {
      "feature": "lag_1",
      "importance": 0.325
    },
    {
      "feature": "lag_7",
      "importance": 0.215
    },
    {
      "feature": "temperature",
      "importance": 0.128
    }
  ],
  "top_drivers": [
    {
      "driver": "lagged_demand",
      "importance": 0.54
    },
    {
      "driver": "calendar_effects",
      "importance": 0.23
    },
    {
      "driver": "weather",
      "importance": 0.18
    }
  ],
  "monitoring": [
    {
      "timestamp": "2024-04-04T00:00:00Z",
      "current_model": "xgboost",
      "rmse": 28.1,
      "mae": 22.0,
      "waste_reduction_pct": 22.5,
      "annual_savings_inr": 458000.0
    }
  ],
  "plot_urls": {
    "demand_vs_actual": "/artifacts/demand_vs_actual.png",
    "feature_importance": "/artifacts/feature_importance.png",
    "cost_savings": "/artifacts/cost_savings.png",
    "waste_comparison": "/artifacts/waste_comparison.png"
  }
}
```

---

## Data Models

### Kitchen

```typescript
{
  kitchen_id: string;           // Unique identifier
  hostel_name: string;          // Name of hostel
  campus_zone: string;          // Campus zone location
  latitude: number;             // Geographic latitude
  longitude: number;            // Geographic longitude
  capacity: number;             // Seating capacity
  capacity_band: string;        // "small" | "medium" | "large"
}
```

### Forecast

```typescript
{
  date: string;                 // YYYY-MM-DD
  horizon_day: number;          // 1-7
  predicted_demand: number;     // Predicted meals
  lower_bound: number;          // 95% CI lower
  upper_bound: number;          // 95% CI upper
  sigma: number;                // Calibrated standard deviation
  menu_type: string;            // Menu type
}
```

### Optimization

```typescript
{
  forecast_date: string;
  predicted_demand: number;
  optimal_quantity: number;     // Newsvendor optimal
  expected_waste: number;
  expected_shortage: number;
  expected_cost: number;        // In INR
  shortage_probability_pct: number;
  service_level_target_pct: number;
  service_level_satisfied: boolean;
}
```

---

## Examples

### Example 1: Next-Day Forecast for K1

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "kitchen_id": "K1",
    "forecast_start_date": "2024-04-05",
    "horizon_days": 1,
    "future_context": [
      {
        "date": "2024-04-05",
        "menu_type": "regular",
        "temperature": 32.5,
        "rainfall": 0,
        "attendance_variation": 0.0,
        "is_holiday": false,
        "is_exam_week": false,
        "is_event_day": false
      }
    ]
  }'
```

### Example 2: 7-Day Forecast

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "kitchen_id": "K2",
    "forecast_start_date": "2024-04-05",
    "horizon_days": 7,
    "future_context": [
      {
        "date": "2024-04-05",
        "menu_type": "regular",
        "temperature": 32.0,
        "rainfall": 0,
        "attendance_variation": 0.0,
        "is_holiday": false,
        "is_exam_week": false,
        "is_event_day": false
      },
      {
        "date": "2024-04-06",
        "menu_type": "protein_rich",
        "temperature": 31.5,
        "rainfall": 5,
        "attendance_variation": 0.05,
        "is_holiday": false,
        "is_exam_week": true,
        "is_event_day": false
      }
    ]
  }'
```

### Example 3: Log Actual Demand

```bash
curl -X POST http://localhost:8000/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "kitchen_id": "K1",
    "date": "2024-04-04",
    "actual_demand": 1580,
    "prepared_quantity": 1650,
    "waste_quantity": 70,
    "menu_type": "regular",
    "temperature": 31,
    "rainfall": 5
  }'
```

### Example 4: Get System Metrics

```bash
curl http://localhost:8000/metrics
```

---

## Rate Limiting

Currently disabled for hackathon. In production:

- **Requests per minute**: 100 per IP
- **Burst limit**: 500 per 5 minutes

Rate limit headers in response:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1712250000
```

---

## Versioning

API version 2.0 is current. Previous versions not supported.

To request a specific version:

```
Accept: application/vnd.kitchen-api.v2+json
```

---

## Changelog

### v2.0 (2024-04-04)
- ✨ Newsvendor optimization
- ✨ SHAP explanations
- ✨ Calibrated prediction intervals
- ✨ 7-day forecasting
- ✨ Scenario analysis
- 🐛 Fixed RMSE calculation
- 📊 Added business metrics

### v1.0 (2024-03-15)
- Initial release

---

## Support

For API support:
1. Check this documentation
2. Review error messages
3. Consult the GitHub issues
4. Contact the team

**Last Updated**: April 2024

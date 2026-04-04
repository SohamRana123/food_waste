from __future__ import annotations

import logging
import threading
from datetime import datetime
from io import BytesIO

import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import (
    FIGURES_DIR,
    FORECAST_HISTORY_FILE,
    METRICS_DIR,
    MODEL_COMPARISON_FILE,
    MONITORING_LOG_FILE,
    PLOT_FILENAMES,
    ForecastConfig,
    ensure_directories,
)
from backend.database import SQLiteRepository, initialize_database
from backend.schemas import (
    FeedbackRequest,
    FeedbackResponse,
    KitchenResponse,
    MetricsResponse,
    PredictRequest,
    PredictionResponse,
    TrainResponse,
    UploadResponse,
)
from backend.storage import load_dataframe, load_summary_metrics


app = FastAPI(
    title="Kolkata Hostel Kitchen Forecasting API",
    description="Spatiotemporal demand forecasting, food waste optimization, and MLOps feedback loop.",
    version="2.0.0",
)
config = ForecastConfig()
ensure_directories()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/artifacts", StaticFiles(directory=str(FIGURES_DIR)), name="artifacts")

logger = logging.getLogger(__name__)
scheduler = None
FEATURE_IMPORTANCE_FILE = METRICS_DIR / "feature_importance.csv"


def _frame_records(frame: pd.DataFrame | None) -> list[dict]:
    if frame is None or frame.empty:
        return []
    return frame.replace({pd.NA: None}).where(pd.notnull(frame), None).to_dict("records")


def _plot_urls() -> dict[str, str]:
    return {key: f"/artifacts/{filename}" for key, filename in PLOT_FILENAMES.items()}


def _group_feature_importance(feature_importance: pd.DataFrame) -> pd.DataFrame:
    if feature_importance.empty:
        return pd.DataFrame(columns=["driver", "importance"])

    def driver_group(feature_name: str) -> str:
        if feature_name.startswith(("lag_", "rolling_", "waste_lag")):
            return "lag_demand_and_history"
        if feature_name.startswith("day_of_week") or feature_name in {
            "month",
            "day_of_month",
            "weekend_flag",
            "season",
        }:
            return "calendar_features"
        if feature_name.startswith("menu_type"):
            return "menu_type"
        if feature_name in {"temperature", "rainfall"}:
            return "weather"
        if feature_name in {"is_holiday", "is_exam_week", "is_event_day", "event_name"}:
            return "academic_and_event_flags"
        if feature_name.startswith(("kitchen_id", "campus_zone", "capacity")):
            return "kitchen_profile"
        return "other"

    grouped = feature_importance.copy()
    grouped["driver"] = grouped["feature"].astype(str).map(driver_group)
    return (
        grouped.groupby("driver", as_index=False)["importance"]
        .sum()
        .sort_values("importance", ascending=False)
        .reset_index(drop=True)
    )


def _top_drivers_payload(feature_importance: pd.DataFrame) -> list[dict[str, float | str]]:
    grouped = _group_feature_importance(feature_importance).head(5)
    return [
        {"driver": row.driver, "importance": float(row.importance)}
        for row in grouped.itertuples(index=False)
    ]


def _get_repository() -> SQLiteRepository:
    initialize_database()
    return SQLiteRepository()


def _load_metrics_payload() -> dict:
    summary = load_summary_metrics()
    comparison = load_dataframe(MODEL_COMPARISON_FILE)
    monitoring = load_dataframe(MONITORING_LOG_FILE)
    feature_importance = load_dataframe(FEATURE_IMPORTANCE_FILE)
    feature_importance = feature_importance if feature_importance is not None else pd.DataFrame()
    current_registry = _get_repository().get_selected_model_registry()
    business_metrics = summary.get("business_metrics", {})
    coverage_metrics = business_metrics.get(
        "coverage_metrics",
        {
            "expected_coverage_pct": float(config.prediction_interval * 100.0),
            "actual_coverage_pct": 0.0,
            "calibration_gap_pct": 0.0,
        },
    )
    service_level_metrics = business_metrics.get(
        "service_level_metrics",
        {
            "target_service_level_pct": float(config.service_level_target * 100.0),
            "target_max_shortage_probability_pct": float((1.0 - config.service_level_target) * 100.0),
            "planned_shortage_probability_pct": float((1.0 - config.service_level_target) * 100.0),
            "realized_shortage_rate_pct": 0.0,
        },
    )
    return {
        "current_model": current_registry["model_name"] if current_registry else summary.get("current_model"),
        "trained_at": summary.get("trained_at"),
        "selected_model_version": current_registry["model_version"]
        if current_registry
        else summary.get("selected_model_version"),
        "model_comparison": _frame_records(comparison),
        "business_metrics": business_metrics,
        "before_after_table": business_metrics.get("before_after_table", []),
        "coverage_metrics": coverage_metrics,
        "service_level_metrics": service_level_metrics,
        "feature_importance": _frame_records(feature_importance.head(10)),
        "top_drivers": _top_drivers_payload(feature_importance),
        "monitoring": _frame_records(monitoring),
        "plot_urls": _plot_urls(),
    }


def _load_dashboard_history() -> dict:
    repository = _get_repository()
    forecast_history = load_dataframe(FORECAST_HISTORY_FILE)
    comparison = load_dataframe(MODEL_COMPARISON_FILE)
    feature_importance = load_dataframe(FEATURE_IMPORTANCE_FILE)
    feature_importance = feature_importance if feature_importance is not None else pd.DataFrame()
    return {
        "forecast_history": _frame_records(forecast_history),
        "model_comparison": _frame_records(comparison),
        "latest_predictions": _frame_records(repository.latest_predictions()),
        "latest_training_runs": _frame_records(repository.latest_training_runs()),
        "feature_importance": _frame_records(feature_importance.head(10)),
        "top_drivers": _top_drivers_payload(feature_importance),
        "plot_urls": _plot_urls(),
    }


def _bootstrap_and_schedule() -> None:
    global scheduler
    try:
        from backend.mlops import bootstrap_system, start_scheduler

        bootstrap_system(config)
    except Exception:
        logger.exception("Kitchen bootstrap (seed data / training) failed")
    try:
        sched = start_scheduler(config)
        scheduler = sched
    except Exception:
        logger.exception("Background scheduler failed to start")


@app.on_event("startup")
def on_startup() -> None:
    threading.Thread(
        target=_bootstrap_and_schedule,
        daemon=True,
        name="kitchen-bootstrap",
    ).start()


@app.on_event("shutdown")
def on_shutdown() -> None:
    global scheduler
    if scheduler is not None:
        scheduler.shutdown(wait=False)
        scheduler = None


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}


@app.get("/kitchens", response_model=list[KitchenResponse])
def list_kitchens() -> list[KitchenResponse]:
    kitchens = _get_repository().list_kitchens()
    return [KitchenResponse(**row) for row in kitchens.to_dict("records")]


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictRequest) -> PredictionResponse:
    try:
        from backend.mlops import get_system

        result = get_system(config).predict(payload.model_dump(mode="json"))
        return PredictionResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/ingest")
def ingest_public_data() -> dict:
    """
    Refresh ``data/raw`` and ``data/processed`` from public APIs (weather, holidays, demand).
    Does not automatically reload SQLite; call ``POST /train`` after ingesting if you need a new panel in the DB.
    """
    from backend.data_ingestion import run_full_ingestion

    return run_full_ingestion(config)


@app.post("/train", response_model=TrainResponse)
def train() -> TrainResponse:
    try:
        from backend.mlops import run_retraining_job

        return TrainResponse(**run_retraining_job(config))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/feedback", response_model=FeedbackResponse)
def feedback(payload: FeedbackRequest) -> FeedbackResponse:
    try:
        from backend.mlops import ingest_feedback

        result = ingest_feedback(
            payload.model_dump(mode="json"),
            config=config,
            retrain_on_feedback=False,
        )
        return FeedbackResponse(**result)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/dataset/upload", response_model=UploadResponse)
async def upload_dataset(file: UploadFile = File(...)) -> UploadResponse:
    try:
        from backend.mlops import ingest_uploaded_dataset

        content = await file.read()
        dataset = pd.read_csv(BytesIO(content))
        outcome = ingest_uploaded_dataset(dataset, config=config, retrain=True)
        training_result = outcome.get("training_result", {})
        return UploadResponse(
            status="uploaded",
            rows_ingested=outcome["rows_ingested"],
            trained=bool(training_result),
            selected_model=training_result.get("selected_model"),
            model_version=training_result.get("selected_model_version"),
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/metrics", response_model=MetricsResponse)
def metrics() -> MetricsResponse:
    payload = _load_metrics_payload()
    if not payload.get("trained_at"):
        raise HTTPException(status_code=404, detail="Metrics are not available yet.")
    return MetricsResponse(**payload)


@app.get("/history")
def history() -> dict:
    return _load_dashboard_history()

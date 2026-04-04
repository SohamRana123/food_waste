# Quick Start Guide

Get the Kitchen Demand Command Center running in **less than 5 minutes**.

## Option 1: Docker Compose (Easiest)

### Prerequisites
- Docker and Docker Compose installed
- ~2GB free disk space
- Port 3000 and 8000 available

### Steps

```bash
# 1. Clone the repository
git clone <repository-url>
cd project

# 2. Start the system
docker-compose up

# 3. Open in browser
# Frontend: http://localhost:3000
# API: http://localhost:8000/health
```

**That's it!** The dashboard will load with sample data and pre-trained models.

### What's Running
- **Frontend** (Next.js): http://localhost:3000
- **Backend** (FastAPI): http://localhost:8000
- **Database** (SQLite): `data/kitchen_ops.db`

### First Steps
1. Navigate to http://localhost:3000
2. View the KPI dashboard with metrics
3. Click "Run Production Forecast"
4. Select a kitchen and forecast horizon
5. View the optimization recommendation
6. Explore model comparison and explainability

### Stop Everything
```bash
docker-compose down
```

---

## Option 2: Local Development

### Prerequisites
- Python 3.10+
- Node.js 18+
- pip and npm

### Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the backend server
cd backend
uvicorn main:app --reload --port 8000
```

Backend will be available at http://localhost:8000

### Frontend Setup (New Terminal)

```bash
# Install JavaScript dependencies
cd frontend
npm install

# Start development server
npm run dev
```

Frontend will be available at http://localhost:3000

---

## Option 3: Cloud Deployment

### Deploy to Railway (Recommended for Hackathon)

1. **Sign up** at https://railway.app
2. **Connect GitHub** repo to Railway
3. **Railway automatically detects** Python + Node.js
4. **Set environment variable**: `NEXT_PUBLIC_API_BASE_URL=https://your-app.railway.app`
5. **Deploy** — automatic on push to main

**Cost**: Free tier includes 500 hours/month

### Deploy to Vercel (Frontend Only)

1. **Sign up** at https://vercel.com
2. **Import repository**
3. **Set root directory**: `frontend`
4. **Set env var**: `NEXT_PUBLIC_API_BASE_URL=<backend-url>`
5. **Deploy** — automatic on push

---

## Using the System

### Dashboard Overview

The dashboard is organized into sections:

#### 1. **KPI Summary** (Top)
- Production Model: Current winner
- Next-day RMSE: Prediction accuracy
- Waste Reduction: % improvement vs. baseline
- Annual Savings: ₹ amount per kitchen

#### 2. **Production Forecast** (Top Section)
Enter forecast parameters:
- **Kitchen**: Select from dropdown
- **Forecast Start Date**: When to start forecast
- **Horizon**: 1 day or 7 days
- **Menu Type**: regular, protein_rich, etc.
- **Weather**: Temperature and rainfall
- **Toggles**: Holiday, exam week, event day

Click **"Run Production Forecast"** to get:
- Next-day cooking recommendation
- Confidence interval
- Expected waste and shortage
- Cost comparison (vs. heuristic)
- Scenario analysis

#### 3. **Model Comparison**
See all 6 candidate models:
- Random Forest, XGBoost, LightGBM, Ridge, Ensemble, TFT
- RMSE, MAE, and improvement metrics
- Current winner highlighted

#### 4. **Pre vs Post Impact**
Before/after comparison showing:
- Daily waste reduction
- Cost per meal savings
- Shortage rate
- Service level compliance

#### 5. **Demand and Waste Charts**
Visualizations showing:
- Historical actual vs. predicted demand
- Baseline waste vs. optimized waste
- Trend over time

#### 6. **Explainability**
Understanding model decisions:
- Top demand drivers
- Feature importance scores
- "Why this forecast" narrative

#### 7. **Feedback Loop**
Log actual outcomes:
- Actual demand served
- Meals prepared
- Waste quantity
- Triggers nightly retraining

---

## API Quick Reference

### Make Predictions

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "kitchen_id": "K1",
    "forecast_start_date": "2024-04-05",
    "horizon_days": 1,
    "future_context": [{
      "date": "2024-04-05",
      "menu_type": "regular",
      "temperature": 32,
      "rainfall": 0,
      "attendance_variation": 0,
      "is_holiday": false,
      "is_exam_week": false,
      "is_event_day": false
    }]
  }'
```

### Log Feedback

```bash
curl -X POST http://localhost:8000/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "kitchen_id": "K1",
    "date": "2024-04-04",
    "actual_demand": 1580,
    "prepared_quantity": 1650,
    "waste_quantity": 70,
    "menu_type": "regular"
  }'
```

### Get Metrics

```bash
curl http://localhost:8000/metrics
```

### Trigger Retraining

```bash
curl -X POST http://localhost:8000/train
```

---

## Keyboard Shortcuts (Frontend)

- **Ctrl+K**: Quick kitchen search
- **Ctrl+F**: Find on page
- **F12**: Developer tools

---

## Common Issues

### Port Already in Use
```bash
# Find process on port 3000
lsof -i :3000

# Or just use different ports
docker-compose -f docker-compose.yml -e FRONTEND_PORT=3001 up
```

### Database Locked
```bash
# SQLite can lock on network drives
# Ensure you have write permissions to ./data/
chmod 755 data/
```

### Frontend Can't Connect to API
```bash
# Check .env or environment variables
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# In docker-compose, use service name
NEXT_PUBLIC_API_BASE_URL=http://backend:8000
```

### Models Fail to Load
```bash
# Ensure model artifacts exist
ls models/artifacts/
# If missing, run:
python -m backend.main
```

---

## File Structure Quick Reference

```
project/
├── frontend/              # Next.js dashboard
│   ├── pages/
│   │   └── index.tsx      # Main dashboard
│   ├── components/        # React components
│   └── styles/            # CSS
├── backend/               # FastAPI server
│   ├── main.py            # App entry point
│   ├── model.py           # ML models
│   ├── optimizer.py       # Newsvendor optimization
│   └── ...
├── data/
│   ├── raw/               # Downloaded datasets
│   ├── processed/         # Processed data
│   └── kitchen_ops.db     # SQLite database
├── models/
│   ├── artifacts/         # Serialized models
│   └── checkpoints/       # TFT training
├── README.md              # Full documentation
├── DEPLOYMENT.md          # Deployment guide
├── API_DOCUMENTATION.md   # REST API docs
├── docker-compose.yml     # Local dev setup
└── Dockerfile             # Backend container
```

---

## Next Steps

### For Judges/Evaluators
1. Run `docker-compose up`
2. Open http://localhost:3000
3. Read dashboard and KPI metrics
4. Try a forecast
5. Review explainability
6. Check model comparison
7. View business impact

### For Developers
1. Fork the repository
2. Make a feature branch
3. Install dependencies locally
4. Run backend and frontend separately
5. Make changes and test
6. Push to GitHub (auto-deploy via Railway)

### For Deployment
1. Read `DEPLOYMENT.md`
2. Choose platform (Railway, Render, AWS, etc.)
3. Set environment variables
4. Deploy with one command
5. Monitor via logs and metrics

---

## Documentation

- **README.md**: Complete system overview
- **DEPLOYMENT.md**: How to deploy to production
- **API_DOCUMENTATION.md**: REST API reference
- **HACKATHON_SUBMISSION.md**: Submission details
- **This file**: Quick start guide

---

## Support

### Check Logs
```bash
# Backend logs
docker logs kitchen-api

# Frontend logs
docker logs kitchen-frontend

# Or locally
# Backend: Check console where uvicorn started
# Frontend: Check browser console (F12)
```

### Common Commands

```bash
# Rebuild without cache
docker-compose up --build

# Remove all data and start fresh
docker-compose down -v
docker-compose up

# Run in background
docker-compose up -d

# Stop services
docker-compose stop

# View logs in real-time
docker-compose logs -f

# Execute command in container
docker-compose exec backend python -m pytest
```

### Need Help?

1. Check `README.md` for detailed documentation
2. Review `API_DOCUMENTATION.md` for endpoint details
3. See `DEPLOYMENT.md` for deployment issues
4. Check GitHub Issues (issues already answered)
5. Read error messages carefully—they're descriptive

---

## Performance Notes

- **First load**: ~2-3 seconds (Next.js build)
- **Forecast prediction**: < 100ms
- **Model training**: 5-10 minutes
- **Dashboard**: 60fps animations

---

## What You'll See

### On Startup
1. Dashboard loads with 6 KPI cards
2. "Production Model" shows XGBoost (or current winner)
3. "Waste Reduction" shows ~22%
4. "Annual Savings" shows ~₹285,000

### After Running a Forecast
1. "Next-day Cooking Decision" card appears
2. Shows optimal quantity (e.g., 1,685 meals)
3. Expected waste (e.g., 45 meals)
4. Expected cost savings (e.g., ₹5,950/day)

### Explainability Section
1. Top drivers listed (lagged demand, weather, etc.)
2. Feature importance chart
3. "Why this forecast" explanation

---

## Success Criteria

You'll know it's working when:
- ✅ Dashboard loads at http://localhost:3000
- ✅ KPI cards show metrics
- ✅ Forecast button is clickable
- ✅ API returns predictions in < 100ms
- ✅ Charts display demand vs. actual
- ✅ Model comparison shows 6 models

---

**Ready?** Run `docker-compose up` and visit http://localhost:3000!

---

**Last Updated**: April 2024
**Version**: 2.0
**Status**: Production-Ready

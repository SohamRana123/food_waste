# Deployment Guide

This guide covers deploying the Kitchen Demand Command Center to production using various platforms.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Cloud Deployment](#cloud-deployment)
4. [Database Migration](#database-migration)
5. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Local Development

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd project
   ```

2. **Setup environment**:
   ```bash
   cp .env.example .env
   ```

3. **Install dependencies**:
   ```bash
   # Backend
   pip install -r requirements.txt

   # Frontend
   cd frontend
   npm install
   cd ..
   ```

4. **Initialize database**:
   ```bash
   python -c "from backend.config import ensure_directories; ensure_directories()"
   ```

5. **Run the system**:

   **Terminal 1 - Backend**:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```

   **Terminal 2 - Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

   Open http://localhost:3000 in your browser.

### Using Docker Compose (Recommended)

```bash
docker-compose up --build
```

This starts both backend and frontend with all dependencies. Access the dashboard at http://localhost:3000.

### Frontend API URL (Compose)

- Compose builds the frontend with `NEXT_PUBLIC_API_BASE_URL=same-origin`, so the browser calls `/api/backend/...` on port 3000 and Next.js rewrites to the `backend` service (`BACKEND_URL_FOR_REWRITE` at build time, defaulting to `http://backend:8000` in `docker-compose.yml`). This avoids broken `localhost:8000` calls from phones or other machines on your LAN.
- **Local dev** (two terminals): use `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` in `frontend/.env.local` (direct to FastAPI; rewrites are unused).

### SQLite path

- Set `SQLITE_DB_FILE` to an absolute path on the mounted data volume (for example `/app/data/kitchen_ops.sqlite` in Compose). The FastAPI app uses this file; a generic `DATABASE_URL` string is not read by the kitchen backend.

---

## Docker Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### Build and Run

1. **Build the images**:
   ```bash
   docker-compose build
   ```

2. **Start the services**:
   ```bash
   docker-compose up -d
   ```

3. **Check health**:
   ```bash
   curl http://localhost:8000/health
   curl http://localhost:3000
   ```

4. **View logs**:
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

5. **Stop services**:
   ```bash
   docker-compose down
   ```

### Production Docker Setup

For production, use a reverse proxy (Nginx) and proper SSL:

```nginx
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name kitchen-api.example.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name kitchen-api.example.com;

    ssl_certificate /etc/letsencrypt/live/kitchen-api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kitchen-api.example.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Cloud Deployment

### Railway.app

Railway provides free PostgreSQL and deployment for Python/Node apps.

1. **Create Railway account** at https://railway.app

2. **Connect GitHub repo** to Railway

3. **Set environment variables**:
   ```
   DATABASE_URL=postgresql://...
   NEXT_PUBLIC_API_BASE_URL=https://your-app.railway.app
   ```

4. **Deploy**:
   - Railway automatically detects Python and Node projects
   - Builds and deploys on push to main branch

### Render.com

Render is another platform-as-a-service option.

1. **Create Render account** at https://render.com

2. **Deploy backend**:
   - Create new "Web Service"
   - Connect GitHub repo
   - Runtime: Python 3.10
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

3. **Deploy frontend**:
   - Create new "Static Site"
   - Root directory: `frontend`
   - Build command: `npm install && npm run build`
   - Publish directory: `.next`

4. **Database**:
   - Use Render PostgreSQL or Supabase

### Vercel (Frontend Only)

Vercel specializes in Next.js deployment.

1. **Create Vercel account** at https://vercel.com

2. **Import your repository**:
   - Select `frontend` as root directory
   - Set `NEXT_PUBLIC_API_BASE_URL` environment variable

3. **Deploy**:
   - Automatic deploys on push to main

### AWS (Full Stack)

1. **Backend on EC2 or ECS**:
   ```bash
   # EC2 setup
   sudo apt update
   sudo apt install python3-pip python3-venv

   git clone <repo-url>
   cd project
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

   # Run with systemd
   sudo tee /etc/systemd/system/kitchen-api.service > /dev/null <<EOF
   [Unit]
   Description=Kitchen Demand API
   After=network.target

   [Service]
   Type=notify
   User=ubuntu
   WorkingDirectory=/home/ubuntu/project
   ExecStart=/home/ubuntu/project/venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   EOF

   sudo systemctl daemon-reload
   sudo systemctl start kitchen-api
   sudo systemctl enable kitchen-api
   ```

2. **Frontend on S3 + CloudFront**:
   ```bash
   # Build frontend
   cd frontend
   npm run build

   # Upload to S3
   aws s3 sync .next s3://your-bucket-name/
   aws s3 sync public s3://your-bucket-name/public/

   # CloudFront will cache and serve
   ```

3. **Database on RDS**:
   - Create PostgreSQL RDS instance
   - Use Supabase for easier setup

---

## Database Migration

### From SQLite to Supabase

1. **Create Supabase project**:
   - Sign up at https://supabase.io
   - Create a new project
   - Note your credentials

2. **Export SQLite data**:
   ```bash
   python -c "
   import pandas as pd
   import sqlite3

   conn = sqlite3.connect('data/kitchen_ops.db')

   # Export each table
   for table in ['kitchens', 'kitchen_operations', 'predictions', 'feedback_logs']:
       df = pd.read_sql(f'SELECT * FROM {table}', conn)
       df.to_csv(f'data/{table}.csv', index=False)

   conn.close()
   "
   ```

3. **Create schema in Supabase**:
   ```bash
   # Run migrations
   psql $DATABASE_URL < migrations/001_create_schema.sql
   ```

4. **Import data**:
   ```bash
   # Use Supabase dashboard or psql COPY command
   ```

5. **Update environment**:
   ```bash
   # .env
   DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]
   ```

6. **Test migration**:
   ```bash
   python -c "
   from backend.repository import Repository
   repo = Repository()
   kitchens = repo.list_kitchens()
   print(f'Migrated {len(kitchens)} kitchens')
   "
   ```

---

## Monitoring & Troubleshooting

### Health Checks

All deployments should implement health checks:

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health (Next.js)
curl http://localhost:3000

# Application health checks
curl http://localhost:8000/metrics
```

### Logging

1. **Backend Logs**:
   ```bash
   # Container logs
   docker logs kitchen-api

   # System logs
   journalctl -u kitchen-api -f

   # Application logs
   tail -f logs/application.log
   ```

2. **Frontend Logs**:
   ```bash
   # Build logs
   npm run build

   # Runtime logs
   docker logs kitchen-frontend
   ```

### Performance Monitoring

1. **API Performance**:
   - Monitor response times via `/metrics`
   - Set up alerting for p99 > 500ms

2. **Database Performance**:
   - Monitor query times
   - Add indexes if needed
   - Archive old prediction data

3. **Memory Usage**:
   - Monitor Python process memory
   - TFT training can use 2-4GB

### Backup Strategy

1. **Database Backups**:
   ```bash
   # Daily SQLite backups
   0 2 * * * sqlite3 data/kitchen_ops.db ".backup 'backups/kitchen_ops_$(date +\%Y\%m\%d).db'"

   # Supabase: automatic backups every 7 days
   ```

2. **Model Artifacts**:
   ```bash
   # Store in cloud storage
   aws s3 cp models/artifacts/ s3://kitchen-api-backups/models/ --recursive
   ```

### Rollback Procedures

1. **API Rollback**:
   ```bash
   # If deployment fails
   docker-compose down
   git checkout previous-version
   docker-compose up -d
   ```

2. **Database Rollback**:
   ```bash
   # Restore from backup
   sqlite3 data/kitchen_ops.db < backups/kitchen_ops_20240404.db
   ```

3. **Model Rollback**:
   ```bash
   # Switch to previous model
   cp models/artifacts/backup/production.joblib models/artifacts/production.joblib
   ```

---

## Performance Tuning

### Database

```sql
-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_operations_kitchen_date
ON kitchen_operations(kitchen_id, date);

CREATE INDEX IF NOT EXISTS idx_predictions_kitchen_date
ON predictions(kitchen_id, forecast_date);

-- Partitioning (for large deployments)
CREATE TABLE kitchen_operations_2024 PARTITION OF kitchen_operations
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### API Caching

```python
# Cache predictions for 1 hour
from functools import lru_cache
import time

@lru_cache(maxsize=1000)
def get_cached_prediction(kitchen_id: str, date: str):
    return predict(kitchen_id, date)
```

### Frontend Optimization

```bash
# Enable compression and caching
npm install --save-dev compression-webpack-plugin

# Production build
npm run build

# Serve with compression
gzip -9 .next/static/*
```

---

## Security Checklist

- [ ] SSL/TLS enabled (https://)
- [ ] Environment variables not committed to git
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] Database credentials rotated quarterly
- [ ] Regular security updates applied
- [ ] Backup encryption enabled
- [ ] Monitoring and alerting configured
- [ ] Disaster recovery plan documented
- [ ] Regular penetration testing scheduled

---

## Support

For deployment issues:

1. Check logs: `docker-compose logs -f`
2. Verify environment variables are set
3. Ensure database connectivity
4. Check API endpoints respond to health checks
5. Review GitHub issues for common problems

For critical issues, contact the development team.

# 🚀 Render Deployment Guide

## Prerequisites
- GitHub account
- Render account (free tier available)
- Your Task Management API ready for deployment

## Step 1: Prepare Your Repository

### 1.1 Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `task-management-api` or similar
3. Keep it public (or private if you have Render Pro)
4. Don't initialize with README (you already have one)

### 1.2 Push Your Code to GitHub
```bash
git init
git add .
git commit -m "Initial commit: Task Management API"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## Step 2: Configure Render Service

### 2.1 Create Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select your `task-management-api` repository

### 2.2 Service Configuration
Fill out the following settings:

**Basic Settings:**
- **Name:** `task-management-api` (or your preferred name)
- **Environment:** `Node`
- **Region:** Choose closest to your users
- **Branch:** `main`

**Build & Deploy Settings:**
- **Root Directory:** (leave empty)
- **Build Command:** `npm run render-build`
- **Start Command:** `npm start`

**Advanced Settings:**
- **Auto-Deploy:** Yes (recommended)

## Step 3: Environment Variables

### 3.1 Required Environment Variables
In the Render dashboard, add these environment variables:

| Key | Value | Description |
|-----|-------|-------------|
| `NODE_ENV` | `production` | Sets production environment |
| `PORT` | `10000` | Render uses port 10000 by default |
| `DATABASE_PATH` | `./data/tasks.db` | SQLite database path |

### 3.2 Optional Environment Variables
| Key | Value | Description |
|-----|-------|-------------|
| `API_BASE_URL` | `https://your-service-name.onrender.com` | Your Render service URL |
| `CORS_ORIGIN` | `https://your-frontend-domain.com` | Allowed CORS origins |

## Step 4: Database Considerations

### 4.1 SQLite on Render
⚠️ **Important:** Render's ephemeral file system means SQLite data won't persist between deployments.

**For Production, Consider:**
1. **PostgreSQL** (Render provides free PostgreSQL databases)
2. **External Database** (Planet Scale, Railway, etc.)

### 4.2 Upgrade to PostgreSQL (Recommended)
To use PostgreSQL instead of SQLite:

1. Add PostgreSQL database in Render
2. Install `pg` package: `npm install pg @types/pg`
3. Update `src/database/connection.ts` to use PostgreSQL
4. Add `DATABASE_URL` environment variable

## Step 5: Deploy

### 5.1 Initial Deployment
1. Click **"Create Web Service"**
2. Render will automatically build and deploy
3. Monitor the build logs for any errors
4. Deployment typically takes 2-5 minutes

### 5.2 Verify Deployment
Once deployed, test these endpoints:

- **Health Check:** `https://your-service.onrender.com/health`
- **API Docs:** `https://your-service.onrender.com/api/docs`
- **Swagger UI:** `https://your-service.onrender.com/docs`
- **Tasks API:** `https://your-service.onrender.com/api/tasks`

## Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain
1. In service settings, go to **"Custom Domains"**
2. Add your domain (e.g., `api.yourdomain.com`)
3. Update DNS records as instructed
4. Render provides free SSL certificates

## Step 7: Monitoring & Maintenance

### 7.1 Service Monitoring
- **Logs:** View real-time logs in Render dashboard
- **Metrics:** Monitor CPU, memory, and response times
- **Health Checks:** Render automatically monitors `/health`

### 7.2 Auto-Deploy
- Pushes to `main` branch trigger automatic deployments
- Use feature branches for development
- Test locally before merging

## 🎯 Quick Start Commands

```bash
# Clone your repo locally
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# Install dependencies
npm install

# Test production build
npm run build

# Test production server
npm start

# Deploy (push to main branch)
git add .
git commit -m "Deploy to production"
git push origin main
```

## 🔧 Troubleshooting

### Common Issues:

1. **Build Fails:**
   - Check Node.js version compatibility
   - Verify all dependencies are listed in `package.json`
   - Review build logs for specific errors

2. **Port Issues:**
   - Ensure your app uses `process.env.PORT`
   - Default Render port is 10000

3. **Database Issues:**
   - SQLite files don't persist on Render
   - Consider upgrading to PostgreSQL for production

4. **CORS Issues:**
   - Update CORS origins in production
   - Set `CORS_ORIGIN` environment variable

### Support Resources:
- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/node-express)
- [Environment Variables](https://render.com/docs/environment-variables)

## 🎉 Success!

Your Task Management API is now live on Render! 🚀

**Next Steps:**
1. Test all API endpoints
2. Set up monitoring and alerts
3. Consider upgrading to PostgreSQL for data persistence
4. Add CI/CD pipeline for automated testing
5. Set up a frontend to consume your API

---

**Your API is now accessible at:** `https://your-service-name.onrender.com`

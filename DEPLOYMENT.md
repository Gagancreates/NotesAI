# Deployment Guide

## Overview
- **Frontend**: Next.js (Deployed on Vercel)
- **Backend**: FastAPI (Deployed on Railway)

---

## Part 1: Deploy Backend to Railway

### Step 1: Prepare Your Repository
1. Commit all changes to git:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

### Step 2: Create Railway Account & Deploy
1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `notes_ai` repository
4. Railway will auto-detect your backend and start deploying

### Step 3: Configure Environment Variables in Railway
1. In your Railway project, click on your service
2. Go to **"Variables"** tab
3. Add all these environment variables from your `backend/.env` file:
   ```
   SUPABASE_URL=<your_supabase_url>
   SUPABASE_ANON_KEY=<your_supabase_anon_key>
   SUPABASE_SERVICE_KEY=<your_supabase_service_key>
   ANTHROPIC_API_KEY=<your_anthropic_api_key>
   OPENAI_API_KEY=<your_openai_api_key>
   PINECONE_API_KEY=<your_pinecone_api_key>
   PINECONE_ENVIRONMENT=us-east-1
   MAX_FILE_SIZE_MB=50
   UPLOAD_DIR=./uploads
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

   **Note**: You'll update `FRONTEND_URL` after deploying the frontend in Part 2.

### Step 4: Configure Build Settings
1. In Railway, go to **"Settings"** tab
2. Ensure these settings:
   - **Root Directory**: `backend`
   - **Build Command**: (leave empty, Railway auto-detects)
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Step 5: Get Your Backend URL
1. Go to **"Settings"** → **"Networking"**
2. Click **"Generate Domain"**
3. Copy the generated URL (e.g., `https://your-app.up.railway.app`)
4. **Save this URL** - you'll need it for frontend deployment

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Create Vercel Account
1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **"Add New"** → **"Project"**
3. Import your `notes_ai` repository

### Step 2: Configure Project Settings
1. **Framework Preset**: Next.js (should auto-detect)
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `.next` (default)

### Step 3: Add Environment Variable
1. In Vercel project settings, go to **"Environment Variables"**
2. Add this variable:
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: <your-railway-backend-url>
   ```
   (Use the Railway URL from Part 1, Step 5)

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait for deployment to complete
3. Copy your Vercel deployment URL (e.g., `https://your-app.vercel.app`)

---

## Part 3: Update Backend CORS Settings

### Step 1: Update Railway Environment Variable
1. Go back to your Railway project
2. Go to **"Variables"** tab
3. Update the `FRONTEND_URL` variable:
   ```
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```
4. Railway will automatically redeploy

---

## Part 4: Test Your Deployment

1. Visit your Vercel frontend URL
2. Upload a PDF file
3. Confirm processing
4. Generate and view notes

### Troubleshooting

**CORS Errors:**
- Ensure `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Check Railway logs for errors

**API Connection Errors:**
- Verify `NEXT_PUBLIC_API_URL` in Vercel points to your Railway backend
- Test backend health: `https://your-railway-app.up.railway.app/health`

**Upload Issues:**
- Check Railway logs for file size limits
- Verify all API keys are set correctly in Railway

---

## Quick Commands

### Local Development
```bash
# Backend
cd backend
source .venv/Scripts/activate  # Windows
uvicorn app.main:app --reload

# Frontend
cd frontend
npm run dev
```

### Viewing Logs
- **Railway**: Click on your service → "Deployments" → Select deployment → View logs
- **Vercel**: Project → "Deployments" → Select deployment → View logs

---

## Important Notes

1. **Never commit `.env` files** - they're in `.gitignore`
2. **API Keys**: Keep your API keys secure in Railway/Vercel environment variables
3. **Railway Costs**: Monitor usage on the Railway dashboard
4. **Vercel Limits**: Free tier has bandwidth and execution limits
5. **Database**: Supabase and Pinecone are already cloud-hosted, no changes needed

---

## Next Steps After Deployment

1. Set up custom domain (optional)
   - Vercel: Settings → Domains
   - Railway: Settings → Networking → Custom Domain

2. Monitor application health
   - Set up error tracking (Sentry, LogRocket)
   - Monitor Railway logs for backend errors
   - Monitor Vercel logs for frontend errors

3. Optimize for production
   - Enable Next.js Image Optimization
   - Set up proper error boundaries
   - Add loading states for better UX

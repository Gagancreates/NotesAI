# Deployment Guide

## Overview
- **Frontend**: Next.js (Deployed on Vercel)
- **Backend**: FastAPI (Deployed on Render)

---

## Part 1: Deploy Backend to Render

### Step 1: Prepare Your Repository
1. Commit all changes to git:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

### Step 2: Create Render Account & Deploy
1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select the `notes_ai` repository
4. Configure the service:
   - **Name**: `notesai-backend` (or your preferred name)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free (or paid if needed)

5. Click **"Advanced"** and set:
   - **Auto-Deploy**: Yes

### Step 3: Configure Environment Variables in Render
1. Scroll down to **"Environment Variables"**
2. Click **"Add Environment Variable"** and add all these from your `backend/.env` file:
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

### Step 4: Deploy
1. Click **"Create Web Service"**
2. Render will start building and deploying your backend
3. Wait for the deployment to complete (this may take 5-10 minutes)

### Step 5: Get Your Backend URL
1. Once deployed, you'll see your service URL at the top (e.g., `https://notesai-backend.onrender.com`)
2. **Save this URL** - you'll need it for frontend deployment
3. Test your backend: Visit `https://your-app.onrender.com/health`

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
   Value: <your-render-backend-url>
   ```
   (Use the Render URL from Part 1, Step 5)

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait for deployment to complete
3. Copy your Vercel deployment URL (e.g., `https://your-app.vercel.app`)

---

## Part 3: Update Backend CORS Settings

### Step 1: Update Render Environment Variable
1. Go back to your Render dashboard
2. Select your backend service
3. Go to **"Environment"** tab
4. Update the `FRONTEND_URL` variable:
   ```
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```
5. Render will automatically redeploy

---

## Part 4: Test Your Deployment

1. Visit your Vercel frontend URL
2. Upload a PDF file
3. Confirm processing
4. Generate and view notes

### Troubleshooting

**CORS Errors:**
- Ensure `FRONTEND_URL` in Render matches your Vercel URL exactly
- Check Render logs for errors

**API Connection Errors:**
- Verify `NEXT_PUBLIC_API_URL` in Vercel points to your Render backend
- Test backend health: `https://your-app.onrender.com/health`

**Backend Slow to Respond:**
- Render free tier sleeps after 15 minutes of inactivity
- First request takes 30-60 seconds to wake up the service
- Consider using a free uptime monitoring service to keep it awake

**Upload Issues:**
- Check Render logs for file size limits
- Verify all API keys are set correctly in Render

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
- **Render**: Dashboard → Select your service → "Logs" tab
- **Vercel**: Project → "Deployments" → Select deployment → View logs

---

## Important Notes

1. **Never commit `.env` files** - they're in `.gitignore`
2. **API Keys**: Keep your API keys secure in Render/Vercel environment variables
3. **Render Free Tier**:
   - 750 hours/month free
   - Services sleep after 15 min inactivity
   - Cold starts take 30-60 seconds
4. **Vercel Limits**: Free tier has bandwidth and execution limits
5. **Database**: Supabase and Pinecone are already cloud-hosted, no changes needed

---

## Next Steps After Deployment

1. Set up custom domain (optional)
   - Vercel: Settings → Domains
   - Railway: Settings → Networking → Custom Domain

2. Monitor application health
   - Set up error tracking (Sentry, LogRocket)
   - Monitor Render logs for backend errors
   - Monitor Vercel logs for frontend errors
   - Set up uptime monitoring (UptimeRobot) to prevent free tier sleep

3. Optimize for production
   - Enable Next.js Image Optimization
   - Set up proper error boundaries
   - Add loading states for better UX

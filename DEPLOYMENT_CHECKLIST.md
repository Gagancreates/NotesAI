# Deployment Checklist

## Pre-Deployment Checklist

- [ ] All code committed to GitHub
- [ ] `.env` files are in `.gitignore` (never commit secrets!)
- [ ] Render account created
- [ ] Vercel account created

---

## Backend Deployment (Render)

- [ ] Create new Web Service on Render
- [ ] Connect GitHub repository
- [ ] Configure service settings:
  - [ ] Root Directory: `backend`
  - [ ] Build Command: `pip install -r requirements.txt`
  - [ ] Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Add all environment variables from `backend/.env`:
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_KEY
  - [ ] ANTHROPIC_API_KEY
  - [ ] OPENAI_API_KEY
  - [ ] PINECONE_API_KEY
  - [ ] PINECONE_ENVIRONMENT
  - [ ] MAX_FILE_SIZE_MB
  - [ ] UPLOAD_DIR
  - [ ] FRONTEND_URL (update after Vercel deployment)
- [ ] Deploy and wait for completion
- [ ] Copy Render URL: `_______________________________`
- [ ] Test backend: Visit `https://your-app.onrender.com/health`

---

## Frontend Deployment (Vercel)

- [ ] Import project from GitHub
- [ ] Set root directory to `frontend`
- [ ] Add environment variable:
  - [ ] NEXT_PUBLIC_API_URL = `<your-render-url>`
- [ ] Deploy
- [ ] Copy Vercel URL: `_______________________________`
- [ ] Test frontend loads correctly

---

## Post-Deployment

- [ ] Update `FRONTEND_URL` in Render with Vercel URL
- [ ] Wait for Render to redeploy (automatic)
- [ ] Test full workflow:
  - [ ] Upload PDF
  - [ ] Confirm processing
  - [ ] Generate notes
  - [ ] View generated notes
- [ ] Check for CORS errors in browser console
- [ ] Verify API calls work in network tab

---

## URLs to Save

```
Backend (Render):   ___________________________________________
Frontend (Vercel):  ___________________________________________
```

---

## Common Issues & Solutions

**CORS Error:**
```
Solution: Ensure FRONTEND_URL in Render exactly matches Vercel URL
Check: No trailing slash in URLs
```

**API Not Found (404):**
```
Solution: Verify NEXT_PUBLIC_API_URL in Vercel is correct
Check: Render backend is running (check logs)
```

**Backend Slow/Not Responding:**
```
Render free tier sleeps after 15min inactivity
First request takes 30-60 seconds to wake up
Solution: Wait for service to wake, or upgrade to paid tier
```

**Upload Fails:**
```
Solution: Check Render logs for errors
Verify: All API keys are set in Render
```

**Notes Don't Generate:**
```
Solution: Check ANTHROPIC_API_KEY is valid
Verify: Pinecone namespace exists
Check: Render logs for detailed error
```

# Deployment Checklist

## Pre-Deployment Checklist

- [ ] All code committed to GitHub
- [ ] `.env` files are in `.gitignore` (never commit secrets!)
- [ ] Railway account created
- [ ] Vercel account created

---

## Backend Deployment (Railway)

- [ ] Create new Railway project from GitHub repo
- [ ] Set root directory to `backend`
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
- [ ] Generate Railway domain
- [ ] Copy Railway URL: `_______________________________`
- [ ] Test backend: Visit `https://your-app.railway.app/health`

---

## Frontend Deployment (Vercel)

- [ ] Import project from GitHub
- [ ] Set root directory to `frontend`
- [ ] Add environment variable:
  - [ ] NEXT_PUBLIC_API_URL = `<your-railway-url>`
- [ ] Deploy
- [ ] Copy Vercel URL: `_______________________________`
- [ ] Test frontend loads correctly

---

## Post-Deployment

- [ ] Update `FRONTEND_URL` in Railway with Vercel URL
- [ ] Wait for Railway to redeploy (automatic)
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
Backend (Railway):  ___________________________________________
Frontend (Vercel):  ___________________________________________
```

---

## Common Issues & Solutions

**CORS Error:**
```
Solution: Ensure FRONTEND_URL in Railway exactly matches Vercel URL
Check: No trailing slash in URLs
```

**API Not Found (404):**
```
Solution: Verify NEXT_PUBLIC_API_URL in Vercel is correct
Check: Railway backend is running (check logs)
```

**Upload Fails:**
```
Solution: Check Railway logs for errors
Verify: All API keys are set in Railway
```

**Notes Don't Generate:**
```
Solution: Check ANTHROPIC_API_KEY is valid
Verify: Pinecone namespace exists
Check: Railway logs for detailed error
```

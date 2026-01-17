# Netlify Deployment Guide for AI Interview Coach

## Prerequisites
- GitHub account with the repository pushed
- Netlify account (sign up at netlify.com)
- Google Gemini API key

## Step-by-Step Deployment

### Step 1: Get Your Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Create API Key"
3. Copy your API key - you'll need this for Netlify

### Step 2: Deploy to Netlify

#### Option A: Deploy from GitHub (Recommended)

1. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub"
   - Authorize Netlify to access your GitHub
   - Select the `ai-interview-coach` repository

2. **Configure Build Settings:**
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/build`
   - Click "Deploy site"

3. **Set Environment Variables:**
   - Go to Site settings → Build & deploy → Environment
   - Add environment variable:
     - Key: `GEMINI_API_KEY`
     - Value: `[Your Gemini API Key]`
   - Click "Save" - Netlify will redeploy automatically

#### Option B: Manual Deployment using Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### Step 3: Update Frontend API Configuration

The frontend is configured to use environment variables:
- Local development: `http://localhost:5000`
- Netlify production: `/.netlify/functions`

No additional changes needed - it's already set up!

### Step 4: Verify Deployment

1. Visit your Netlify site URL
2. Test the health endpoint: `https://your-site.netlify.app/.netlify/functions/health`
3. Try generating questions to ensure the API is working

## Features of This Configuration

✅ **Frontend:** React app built and served statically
✅ **Backend:** Node.js functions running on Netlify Functions
✅ **CORS:** Automatically handled for all functions
✅ **API Routing:** `/api/*` requests route to Netlify Functions
✅ **SPA Routing:** All non-matching routes redirect to `index.html`
✅ **Environment Variables:** Securely configured in Netlify

## File Structure

```
ai-interview-coach/
├── netlify/
│   └── functions/
│       ├── generate-questions.js   # API endpoint for generating questions
│       ├── analyze.js              # API endpoint for analyzing answers
│       └── health.js               # Health check endpoint
├── netlify.toml                    # Netlify configuration
├── frontend/                       # React frontend
│   ├── src/
│   ├── public/
│   └── build/                      # Generated on deploy
├── backend/                        # Original backend (for reference)
└── .env.example                    # Environment variables template
```

## Environment Variables

Create a `.env` file in your project root:

```
GEMINI_API_KEY=your_gemini_api_key_here
REACT_APP_API_URL=/.netlify/functions
```

**Note:** Only set these in Netlify settings, not in the repository.

## Troubleshooting

### 1. API Calls Failing
- Check if GEMINI_API_KEY is set in Netlify environment variables
- Verify the API key is valid
- Check browser console for CORS errors

### 2. Frontend Not Loading
- Verify build directory is set to `frontend/build`
- Check build command output in Netlify logs
- Ensure `npm install` runs before build

### 3. Netlify Functions Not Working
- Check Netlify Functions logs: Site settings → Functions
- Verify functions are in `netlify/functions/` directory
- Ensure files use `.js` extension and export handler

### 4. Questions Not Generating
- Confirm GEMINI_API_KEY is correctly set
- Check function logs for error messages
- Verify API key has Generative Language API enabled

## Local Development

To test locally before deploying:

```bash
# Terminal 1: Backend
cd backend
npm install
npm start

# Terminal 2: Frontend
cd frontend
npm install
npm start
# Set REACT_APP_API_URL=http://localhost:5000
```

## Production Optimization Tips

1. **Cache Optimization:** The netlify.toml is configured with caching
2. **Cold Starts:** First request to functions may take longer
3. **Rate Limiting:** Implement rate limiting on Netlify Functions if needed
4. **Error Handling:** All functions include proper error handling

## Security Best Practices

✅ API key stored in Netlify secrets (not in code)
✅ CORS properly configured
✅ Environment-specific configurations
✅ No sensitive data in repository

## Next Steps

1. Push this code to GitHub
2. Deploy to Netlify using GitHub integration
3. Set GEMINI_API_KEY in Netlify environment variables
4. Test all features
5. Share your deployed URL!

## Support

If you encounter issues:
1. Check Netlify build logs
2. Review browser console for errors
3. Test the health endpoint
4. Verify environment variables are set

# Setup & Installation Guide

## Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **A modern web browser** (Chrome, Edge, Firefox, Safari)
- **Microphone** for voice input

## Installation Steps

### 1. Backend Setup

```bash
cd backend
npm install
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

### 3. Environment Variables

Create a `.env` file in the backend directory:

```
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
```

To get a Gemini API key:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy it to your `.env` file

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

The frontend will open at `http://localhost:3000`

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
```

## Features

### Interview Session Features
- ✅ Voice-based interview practice
- ✅ AI-powered question generation
- ✅ Real-time transcription
- ✅ Instant answer analysis
- ✅ Score feedback (0-10)
- ✅ Expert suggestions

### Report & Analytics (NEW!)
- 📊 Interactive performance charts
- 📈 Score trend visualization
- 📉 Time vs score analysis
- 🎯 Performance distribution pie chart
- 📡 Radar chart for multi-dimensional analysis
- 📋 Question-by-question breakdown
- 💡 Key insights and recommendations
- 📥 **PDF export** - Download professional report
- 📊 **JSON export** - Raw data export
- 📋 **CSV export** - Spreadsheet-compatible format

## Project Structure

```
ai-interview-coach/
├── backend/
│   ├── server.js              # Main server file
│   ├── package.json
│   └── .env                   # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main app component
│   │   ├── App.css            # App styles
│   │   ├── InterviewReport.jsx # NEW! Report component
│   │   ├── InterviewReport.css # NEW! Report styles
│   │   ├── index.js
│   │   ├── index.css
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── .env (optional)
└── README.md
```

## API Endpoints

### Generate Interview Questions
```
POST /generate-questions
Body: {
  jobRole: string,
  company?: string,
  numQuestions: number (1-20),
  difficulty: "easy" | "medium" | "hard",
  experience: "0-1" | "2-4" | "5-8" | "9+",
  mock?: boolean
}
```

### Analyze Answer
```
POST /analyze
Body: {
  question: string,
  answer: string,
  timeTaken: number (seconds),
  jobRole?: string,
  mock?: boolean
}
Response: {
  score: number (0-10),
  feedback: string,
  betterAnswer: string
}
```

### Health Check
```
GET /health
```

## Troubleshooting

### Microphone Not Working
- Check browser permissions
- Ensure microphone is enabled in system settings
- Try a different browser

### API Connection Error
- Verify backend is running on `http://localhost:5000`
- Check `REACT_APP_API_URL` environment variable
- Ensure CORS is enabled

### PDF Download Issues
- Use a recent version of your browser
- Try a different browser if problem persists
- Clear browser cache and try again

### Missing Voices
- Voices depend on your system and browser
- Different operating systems provide different text-to-speech voices
- Browser needs to download voice data on first use

## Performance Optimization

### Frontend
- Reports are generated client-side for better performance
- Charts use React virtualization for smooth rendering
- Images are optimized for PDF export

### Backend
- Responses are cached when possible
- API calls are limited to prevent abuse
- Mock mode available for development/testing

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Best experience, all features |
| Edge | ✅ Full | Chromium-based, same as Chrome |
| Firefox | ✅ Full | All features supported |
| Safari | ⚠️ Partial | Some voice limitations |
| Opera | ✅ Full | Chromium-based |
| IE 11 | ❌ None | Not supported |

## Deployment

### Vercel (Frontend)
```bash
npm install -g vercel
vercel
```

### Render/Heroku (Backend)
```bash
# Render
- Connect GitHub repo
- Set GEMINI_API_KEY in environment variables
- Deploy

# Heroku
- Create Procfile
- Deploy with git push
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is provided as-is for educational purposes.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check browser console for errors
4. Verify all dependencies are installed

## Version

**AI Interview Coach Pro v2.0**
- Added detailed report generation
- Added interactive charts and analytics
- Added PDF, JSON, and CSV export
- Enhanced performance tracking

---

**Happy Practicing! 🎉**

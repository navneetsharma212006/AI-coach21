# Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    React Frontend App                        │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │           Interview Setup Form                        │ │  │
│  │  │  (Job Role, Company, Experience, Difficulty)        │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                            ↓                                 │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │         Question Generation & Voice Recording        │ │  │
│  │  │  (Web Audio API, Speech Recognition API)             │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                            ↓                                 │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │      Answer Analysis & Score Collection              │ │  │
│  │  │  (Stores: question, answer, score, time, feedback)  │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                            ↓                                 │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │      ⭐ NEW: Detailed Report Page ⭐                │ │  │
│  │  │                                                      │ │  │
│  │  │  ┌─────────────────────────────────────────────────┐ │ │  │
│  │  │  │ InterviewReport Component (Client-Side)       │ │ │  │
│  │  │  ├─────────────────────────────────────────────────┤ │ │  │
│  │  │  │ • Performance Summary Cards (React)           │ │ │  │
│  │  │  │ • Interactive Charts (Recharts Library)       │ │ │  │
│  │  │  │   - Line Chart: Score Trend                  │ │ │  │
│  │  │  │   - Bar Chart: Time vs Score                 │ │ │  │
│  │  │  │   - Pie Chart: Performance Distribution      │ │ │  │
│  │  │  │   - Radar Chart: Multi-dimensional View      │ │ │  │
│  │  │  │ • Detailed Results Table                      │ │ │  │
│  │  │  │ • Key Insights Section                        │ │ │  │
│  │  │  ├─────────────────────────────────────────────────┤ │ │  │
│  │  │  │ EXPORT OPTIONS:                               │ │ │  │
│  │  │  │ 📥 PDF  (html2canvas + jsPDF)                │ │ │  │
│  │  │  │ 📊 JSON (Raw Data)                           │ │ │  │
│  │  │  │ 📋 CSV  (Spreadsheet Format)                 │ │ │  │
│  │  │  └─────────────────────────────────────────────────┘ │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  ↕ HTTP
                            Axios/Fetch
┌─────────────────────────────────────────────────────────────────────┐
│                    Node.js/Express Backend                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │          API Endpoints                                       │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │                                                              │  │
│  │  • POST /generate-questions   → Gemini API                 │  │
│  │  • POST /analyze              → Gemini API                 │  │
│  │  • GET /health                → Status Check               │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                  ↕
                          Google Gemini API
```

## Data Flow Diagram

```
START INTERVIEW
    ↓
[User Input] ─→ jobRole, company, experience, difficulty
    ↓
[Generate Questions] ─→ POST /generate-questions
    ↓
[Gemini API] ─→ Returns 5-20 interview questions
    ↓
[Display Question] ─→ Show Q1, enable microphone
    ↓
[Record Answer] ─→ User speaks answer
    ↓
[Transcription] ─→ Speech Recognition API converts to text
    ↓
[Analyze Answer] ─→ POST /analyze (question, answer, time)
    ↓
[Gemini API] ─→ Returns score (0-10), feedback, suggestions
    ↓
[Store Data] ─→ questionsData array:
    │   {
    │     question: string,
    │     answer: string,
    │     score: number,
    │     feedback: string,
    │     suggestion: string,
    │     timeTaken: number
    │   }
    ↓
[Next Question?] ─→ More questions? Yes → Repeat from "Display Question"
    │                                 No ↓
    ↓
⭐ INTERVIEW COMPLETE ⭐
    ↓
[Automatic Redirect] ─→ showReport = true
    ↓
┌─────────────────────────────────────────────────┐
│  DETAILED REPORT PAGE                           │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Calculate Metrics]                            │
│  • averageScore = sum(scores) / count          │
│  • averageTime = sum(times) / count            │
│  • scoreDistribution analysis                  │
│                                                 │
│         ↓                                       │
│                                                 │
│ [Render Report]                                │
│  • Summary Cards                               │
│  • Charts (Recharts)                           │
│  • Results Table                               │
│  • Insights Section                            │
│                                                 │
│         ↓                                       │
│                                                 │
│ [User Actions]                                 │
│  ├─ Download PDF                               │
│  │  └─ html2canvas → PNG → jsPDF               │
│  ├─ Download JSON                              │
│  │  └─ JSON.stringify → Blob → Download        │
│  ├─ Download CSV                               │
│  │  └─ Array → CSV format → Download           │
│  └─ Start New Interview                        │
│     └─ Reset state → Clear data → Home         │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Component Hierarchy

```
App.jsx
├── When showReport = false
│   ├── Header
│   │   └── Title + Description
│   ├── Interview Setup Form
│   │   ├── Presets selector
│   │   ├── Job role input
│   │   ├── Company input
│   │   ├── Experience selector
│   │   ├── Difficulty selector
│   │   ├── Question limit input
│   │   ├── Max duration input
│   │   └── Voice settings
│   ├── Generate Button
│   └── Interview Session (when questions loaded)
│       ├── Progress bar
│       ├── Question display
│       ├── Transcription box
│       ├── Voice controls
│       ├── Analysis results
│       └── Next question button
│
└── When showReport = true
    └── InterviewReport.jsx
        ├── Report header
        │   ├── Title
        │   └── Session metadata
        ├── Summary Cards
        │   ├── Average Score
        │   ├── Total Questions
        │   ├── Average Time
        │   └── Score Range
        ├── Charts Section
        │   ├── Line Chart (Score Trend)
        │   ├── Bar Chart (Time vs Score)
        │   ├── Pie Chart (Distribution)
        │   └── Radar Chart (Performance)
        ├── Detailed Results Section
        │   └── Results Table
        │       ├── Question column
        │       ├── Score column
        │       ├── Time column
        │       ├── Performance badge
        │       └── Feedback column
        ├── Insights Section
        │   ├── Strengths card
        │   ├── Improvements card
        │   └── Next steps card
        ├── Footer
        └── Export Buttons
            ├── PDF Download
            ├── JSON Download
            ├── CSV Download
            └── Restart Button
```

## State Management Flow

```
App.jsx State:
├── Interview Setup State
│   ├── jobRole
│   ├── company
│   ├── experience
│   ├── difficulty
│   ├── numQuestions
│   ├── maxDuration
│   └── mockMode
│
├── Interview Session State
│   ├── questions (array)
│   ├── currentIndex
│   ├── transcription
│   ├── recordingTime
│   ├── analysis (current)
│   ├── showEdit
│   ├── editedAnswer
│   ├── isListening
│   ├── isAnalyzing
│   └── isGenerating
│
├── Voice Settings State
│   ├── voices
│   ├── selectedVoice
│   ├── voiceRate
│   └── voicePitch
│
├── ⭐ NEW: Report State
│   ├── showReport (boolean)
│   └── questionsData (array of objects)
│       └── Each object:
│           ├── question
│           ├── answer
│           ├── score
│           ├── feedback
│           ├── suggestion
│           └── timeTaken
│
└── UI State
    ├── status (message)
    └── isError (boolean)
```

## Data Processing Pipeline

```
User Input
    ↓
API Call (Question Generation)
    ↓
Store Questions
    ↓
For Each Question:
    ├─ Display Question
    ├─ Record Answer (Voice → Text)
    ├─ Send to API (Analysis)
    ├─ Receive Score & Feedback
    ├─ Store in questionsData
    │   {
    │     question: "...",
    │     answer: "...",
    │     score: 7,
    │     feedback: "...",
    │     suggestion: "...",
    │     timeTaken: 45
    │   }
    └─ Show Next Question
        ↓
    All Questions Done?
    ├─ Yes → Generate Report
    │        ├─ Calculate metrics
    │        ├─ Render visualizations
    │        └─ Enable exports
    └─ No → Continue to next question
```

## Export Pipeline

```
Report Data (questionsData array)
    ↓
┌─────────────────┬──────────────────┬──────────────────┐
│                 │                  │                  │
↓                 ↓                  ↓                  ↓
[PDF Export]   [JSON Export]     [CSV Export]     [New Interview]
    ↓                 ↓                  ↓                  ↓
html2canvas    JSON.stringify   Array → CSV    Reset State
    ↓                 ↓                  ↓                  ↓
jsPDF          Blob Creation    Blob Creation    Home Page
    ↓                 ↓                  ↓                  ↓
Download       Download         Download        New Session
```

## Browser APIs Used

```
Web Audio API
├── MediaDevices.getUserMedia()
└── AudioContext

Speech Recognition API
├── SpeechRecognition (webkit prefix)
├── Continuous recognition
└── Interim results

Text-to-Speech API
├── SpeechSynthesisUtterance
├── Voice selection
├── Rate control
└── Pitch control

Canvas API
└── html2canvas (library wrapper)

Blob & File APIs
├── Blob creation
├── URL.createObjectURL
└── Download triggering

LocalStorage
└── User preferences (voice, rate, pitch)

DOM APIs
└── innerHTML manipulation for report
```

## Performance Optimization

```
Frontend Optimization:
├── React lazy loading
├── Chart virtualization (Recharts)
├── Image compression for PDF
├── Efficient state updates
└── CSS optimizations

Backend Optimization:
├── API response caching (future)
├── Question generation limiting
└── Rate limiting

PDF Generation:
├── Client-side only (no server load)
├── Canvas compression
└── Lazy chart rendering (on viewport)

CSV/JSON Export:
├── Direct browser download
└── No server processing
```

## Security & Privacy

```
Data Flow:
├── User Input → Local Component State
├── API Calls → Gemini API (encrypted HTTPS)
├── Analysis Results → Local Storage
├── Report Generation → Client-side only
├── Exports → Local file system
└── NO server-side data storage

Privacy Features:
├── All processing client-side
├── No tracking pixels
├── No analytics on reports
├── Local-only export
└── User has full control
```

---

**Architecture Version**: 2.0 (Report Edition)
**Last Updated**: January 2026

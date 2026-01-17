# Component Documentation

## InterviewReport Component

### Location
`frontend/src/InterviewReport.jsx`

### Purpose
Displays a comprehensive interview performance report with analytics, charts, and export options.

### Props

#### `sessionData` (Object) - Required
Complete interview session information.

**Structure:**
```javascript
{
  jobRole: string,           // e.g., "Frontend Engineer"
  company: string,           // e.g., "Google" (optional)
  experience: string,        // "0-1", "2-4", "5-8", "9+"
  difficulty: string,        // "easy", "medium", "hard"
  timestamp: string,         // ISO timestamp of session start
  questionsData: Array       // Array of question results (see below)
}
```

#### `questionsData` (Array) - Required
Array of results for each question answered.

**Each item structure:**
```javascript
{
  question: string,          // The interview question
  answer: string,            // Your answer
  score: number,             // Score 0-10
  feedback: string,          // AI feedback
  suggestion: string,        // Better answer example
  timeTaken: number          // Time in seconds
}
```

#### `onRestart` (Function) - Required
Callback function triggered when user clicks "Start New Interview".

**Function signature:**
```javascript
() => void
```

### Features

#### 1. Performance Summary
- Average score calculation
- Question count tracking
- Average time per question
- Min/max score range

#### 2. Charts (using Recharts)
- **LineChart**: Score trend across questions
- **BarChart**: Time vs score comparison
- **PieChart**: Performance distribution breakdown
- **RadarChart**: Multi-dimensional performance view

#### 3. Detailed Results Table
- Question text display
- Individual scores
- Time tracking
- Performance badges with color coding
- Detailed feedback and suggestions

#### 4. Insights Section
- Strengths identification
- Areas for improvement
- Actionable next steps

#### 5. Export Functions
- **PDF Export**: Uses html2canvas + jsPDF
- **JSON Export**: Raw session data
- **CSV Export**: Spreadsheet format

### Usage Example

```javascript
import InterviewReport from './InterviewReport';

// In your component
<InterviewReport 
  sessionData={{
    jobRole: 'Frontend Engineer',
    company: 'Google',
    experience: '5-8',
    difficulty: 'medium',
    timestamp: new Date().toISOString(),
    questionsData: [
      {
        question: 'Tell me about yourself?',
        answer: 'I am a frontend engineer with 5 years of experience...',
        score: 8,
        feedback: 'Great answer with specific examples.',
        suggestion: 'An improved answer would emphasize...',
        timeTaken: 45
      },
      // ... more questions
    ]
  }}
  onRestart={() => {
    // Handle restart logic
  }}
/>
```

## App Component Updates

### New State Variables

```javascript
const [showReport, setShowReport] = useState(false);
const [questionsData, setQuestionsData] = useState([]);
```

### Updated Functions

#### `handleAnalyzeAnswer()`
Now captures and stores question data:
```javascript
const questionData = {
  question: questions[currentIndex],
  answer,
  score: response.data.score,
  feedback: response.data.feedback,
  suggestion: response.data.betterAnswer,
  timeTaken
};

setQuestionsData([...questionsData, questionData]);
```

#### `handleNextQuestion()`
Transitions to report view when all questions answered:
```javascript
if (currentIndex >= questions.length - 1) {
  setShowReport(true);
}
```

#### `handleRestart()`
Resets all state to start a new interview:
```javascript
const handleRestart = () => {
  setShowReport(false);
  setQuestions([]);
  setCurrentIndex(-1);
  // ... reset other states
};
```

## Styling

### CSS Files

#### `InterviewReport.css`
- Report container styling
- Chart container layouts
- Summary card designs
- Table styling
- Export button styles
- Responsive design (mobile, tablet, desktop)
- Print media queries for PDF export

### Key CSS Classes

**Layout:**
- `.interview-report` - Main container
- `.report-container` - Report content
- `.report-header` - Header section
- `.summary-section` - Summary cards area
- `.charts-section` - Charts area
- `.detailed-results-section` - Results table area

**Components:**
- `.summary-card` - Individual metric cards
- `.chart-container` - Chart wrapper
- `.results-table` - Question results table
- `.insight-card` - Insight boxes

**States:**
- `.score-excellent` - High performing questions (8+)
- `.score-good` - Good performance (6-8)
- `.score-average` - Average performance (4-6)
- `.score-poor` - Low performance (<4)

## Dependencies

### New Dependencies Added

```json
{
  "recharts": "^2.10.3",    // Chart library
  "jspdf": "^2.5.1",        // PDF generation
  "html2canvas": "^1.4.1"   // HTML to image conversion
}
```

### Existing Dependencies Used

```json
{
  "react": "^18.2.0",       // React framework
  "react-dom": "^18.2.0",   // React DOM
  "axios": "^1.6.7"         // HTTP client
}
```

## Performance Considerations

### Optimization Techniques

1. **Memoization**: Consider using React.memo for chart components
2. **Lazy Loading**: Charts rendered on demand
3. **Canvas Rendering**: PDF generation done on client-side
4. **Responsive Design**: Optimized for all screen sizes

### Data Limits

- Maximum 20 questions per session
- Report generation may take 2-5 seconds for PDF export
- All processing happens client-side (no server load)

## Accessibility

### Features

- Semantic HTML structure
- Color contrast for readability
- Keyboard navigation support
- ARIA labels on interactive elements
- Responsive text sizing

### Improvements Made

- Table headers clearly labeled
- Color-blind friendly color schemes (gradients + patterns)
- Sufficient spacing between elements
- Alt text for chart data

## Browser API Usage

### APIs Used

1. **Canvas API** - For PDF generation via html2canvas
2. **Blob API** - For file creation and download
3. **URL API** - For object URLs
4. **LocalStorage** - For saving user preferences (voice settings)

## Error Handling

### Scenarios Handled

1. **Missing Session Data**
   - Shows error message with restart button
   
2. **PDF Generation Failure**
   - Shows alert with error message
   - User can retry or choose different export format

3. **CSV Export Errors**
   - Graceful handling of special characters
   - Proper escaping of quotes in text

## Future Enhancement Ideas

1. **Multi-session Comparison**: Compare performance across multiple interviews
2. **Leaderboard**: Compare scores with other users
3. **Personalized Tips**: AI-generated improvement suggestions
4. **Video Recording**: Record and review video answers
5. **Mock Interview Scheduling**: Schedule practice sessions
6. **Email Reports**: Send reports via email
7. **Dashboard**: Persistent storage of all interviews
8. **Advanced Analytics**: Trend analysis over time
9. **Custom Reports**: User-defined report templates
10. **Social Sharing**: Share achievements on social media

---

**Last Updated**: January 2026
**Component Version**: 2.0

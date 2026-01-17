import React, { useState, useRef } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './InterviewReport.css';

const InterviewReport = ({ sessionData, onRestart }) => {
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const reportRef = useRef(null);

  if (!sessionData || !sessionData.questionsData) {
    return (
      <div className="report-error">
        <p>No interview data available. Please complete an interview first.</p>
        <button onClick={onRestart} className="restart-btn">Start New Interview</button>
      </div>
    );
  }

  const { questionsData, jobRole, company, experience, difficulty, timestamp } = sessionData;

  // Calculate metrics
  const totalQuestions = questionsData.length;
  const averageScore = (questionsData.reduce((sum, q) => sum + q.score, 0) / totalQuestions).toFixed(1);
  const totalTime = questionsData.reduce((sum, q) => sum + q.timeTaken, 0);
  const averageTime = (totalTime / totalQuestions).toFixed(0);
  const maxScore = Math.max(...questionsData.map(q => q.score));
  const minScore = Math.min(...questionsData.map(q => q.score));
  
  // Accuracy categories
  const accuracyData = questionsData.map((q, idx) => ({
    question: `Q${idx + 1}`,
    score: q.score,
    time: q.timeTaken
  }));

  // Score distribution
  const scoreDistribution = {
    excellent: questionsData.filter(q => q.score >= 8).length,
    good: questionsData.filter(q => q.score >= 6 && q.score < 8).length,
    average: questionsData.filter(q => q.score >= 4 && q.score < 6).length,
    needsImprovement: questionsData.filter(q => q.score < 4).length
  };

  const scoreDistributionData = [
    { name: 'Excellent (8-10)', value: scoreDistribution.excellent, color: '#10b981' },
    { name: 'Good (6-8)', value: scoreDistribution.good, color: '#3b82f6' },
    { name: 'Average (4-6)', value: scoreDistribution.average, color: '#f59e0b' },
    { name: 'Needs Work (<4)', value: scoreDistribution.needsImprovement, color: '#ef4444' }
  ];

  // Time vs Score
  const timeVsScoreData = questionsData.map((q, idx) => ({
    question: `Q${idx + 1}`,
    score: q.score,
    time: q.timeTaken
  }));

  // Performance by answer type
  const performanceData = questionsData.map((q, idx) => ({
    name: `Q${idx + 1}`,
    score: q.score,
    fullMark: 10
  }));

  // Download PDF
  const downloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true
      });

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;

      const pageData = canvas.toDataURL('image/png');
      
      while (heightLeft >= 0) {
        pdf.addImage(pageData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        if (heightLeft > 0) {
          pdf.addPage();
          position = heightLeft - imgHeight;
        }
      }

      const filename = `interview-report-${jobRole}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Download JSON
  const downloadJSON = () => {
    const dataStr = JSON.stringify(sessionData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interview-report-${jobRole}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download CSV
  const downloadCSV = () => {
    const headers = ['Question #', 'Score', 'Time Taken (s)', 'Feedback'];
    const rows = questionsData.map((q, idx) => [
      `Q${idx + 1}`,
      q.score,
      q.timeTaken,
      `"${q.feedback.replace(/"/g, '""')}"`
    ]);

    const csv = [
      ['Interview Report'],
      ['Job Role', jobRole],
      ['Company', company || 'N/A'],
      ['Experience Level', experience],
      ['Difficulty', difficulty],
      ['Date', timestamp],
      [''],
      headers,
      ...rows,
      [''],
      ['Summary'],
      ['Average Score', averageScore],
      ['Average Time', `${averageTime}s`],
      ['Total Time', `${totalTime}s`],
      ['Highest Score', maxScore],
      ['Lowest Score', minScore]
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interview-report-${jobRole}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="interview-report">
      <div className="report-container" ref={reportRef}>
        {/* Header */}
        <div className="report-header">
          <div className="header-content">
            <h1>Interview Performance Report</h1>
            <div className="header-meta">
              <div className="meta-item">
                <span className="meta-label">Position:</span>
                <span className="meta-value">{jobRole}</span>
              </div>
              {company && (
                <div className="meta-item">
                  <span className="meta-label">Company:</span>
                  <span className="meta-value">{company}</span>
                </div>
              )}
              <div className="meta-item">
                <span className="meta-label">Level:</span>
                <span className="meta-value">{experience}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Difficulty:</span>
                <span className="meta-value">{difficulty}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Date:</span>
                <span className="meta-value">
                  {new Date(timestamp).toLocaleDateString()} {new Date(timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-section">
          <h2>Performance Summary</h2>
          <div className="summary-cards">
            <div className="summary-card primary">
              <div className="card-label">Average Score</div>
              <div className="card-value">{averageScore}/10</div>
              <div className="card-subtext">Overall Performance</div>
            </div>
            <div className="summary-card success">
              <div className="card-label">Total Questions</div>
              <div className="card-value">{totalQuestions}</div>
              <div className="card-subtext">Completed</div>
            </div>
            <div className="summary-card info">
              <div className="card-label">Average Time</div>
              <div className="card-value">{averageTime}s</div>
              <div className="card-subtext">Per Question</div>
            </div>
            <div className="summary-card warning">
              <div className="card-label">Score Range</div>
              <div className="card-value">{minScore}-{maxScore}</div>
              <div className="card-subtext">Min to Max</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          {/* Score Trend */}
          <div className="chart-container full-width">
            <h3>Score Trend Across Questions</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={accuracyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="question" stroke="#6b7280" />
                <YAxis domain={[0, 10]} stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value) => [`${value}/10`, 'Score']}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                  name="Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Time vs Score */}
          <div className="chart-container half-width">
            <h3>Time vs Score Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeVsScoreData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="question" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="score" fill="#10b981" name="Score" />
                <Bar dataKey="time" fill="#f59e0b" name="Time (s)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Score Distribution */}
          <div className="chart-container half-width">
            <h3>Performance Distribution</h3>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={scoreDistributionData}
                  cx="50%"
                  cy="45%"
                  labelLine={true}
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {scoreDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} question${value !== 1 ? 's' : ''}`} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Radar */}
          <div className="chart-container full-width">
            <h3>Detailed Performance Analysis</h3>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={performanceData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="name" stroke="#6b7280" />
                <PolarRadiusAxis angle={90} domain={[0, 10]} stroke="#6b7280" />
                <Radar 
                  name="Score" 
                  dataKey="score" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value) => `${value}/10`}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="detailed-results-section">
          <h2>Question-by-Question Analysis</h2>
          <div className="results-table">
            <table>
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Score</th>
                  <th>Time (s)</th>
                  <th>Performance</th>
                  <th>Feedback & Suggestions</th>
                </tr>
              </thead>
              <tbody>
                {questionsData.map((item, idx) => (
                  <tr key={idx} className={`score-${item.score >= 8 ? 'excellent' : item.score >= 6 ? 'good' : item.score >= 4 ? 'average' : 'poor'}`}>
                    <td className="question-col">
                      <strong>Q{idx + 1}</strong>
                      <div className="question-text">{item.question}</div>
                    </td>
                    <td className="score-col">
                      <div className="score-badge">{item.score}/10</div>
                    </td>
                    <td className="time-col">{item.timeTaken}s</td>
                    <td className="performance-col">
                      <div className={`performance-badge ${item.score >= 8 ? 'excellent' : item.score >= 6 ? 'good' : item.score >= 4 ? 'average' : 'poor'}`}>
                        {item.score >= 8 ? '⭐ Excellent' : item.score >= 6 ? '✓ Good' : item.score >= 4 ? '◐ Average' : '✗ Needs Work'}
                      </div>
                    </td>
                    <td className="feedback-col">
                      <div className="feedback-text">
                        <p><strong>Feedback:</strong> {item.feedback}</p>
                        <p><strong>Your Answer:</strong> {item.answer}</p>
                        {item.suggestion && (
                          <p><strong>Suggestion:</strong> {item.suggestion}</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Insights */}
        <div className="insights-section">
          <h2>Key Insights & Recommendations</h2>
          <div className="insights-grid">
            <div className="insight-card">
              <h4>🎯 Strengths</h4>
              <ul>
                <li>Questions answered with scores of 8+ demonstrate strong knowledge</li>
                <li>Consistent performance across multiple questions shows reliability</li>
                <li>Ability to articulate thoughts clearly within reasonable timeframes</li>
              </ul>
            </div>
            <div className="insight-card">
              <h4>💡 Areas for Improvement</h4>
              <ul>
                <li>Review questions with lower scores for deeper understanding</li>
                <li>Practice providing concrete examples and metrics in answers</li>
                <li>Work on time management - aim for balanced, concise responses</li>
              </ul>
            </div>
            <div className="insight-card">
              <h4>📈 Next Steps</h4>
              <ul>
                <li>Take additional interviews at the same or higher difficulty level</li>
                <li>Focus on behavioral questions if average score indicates weakness</li>
                <li>Record video answers for better feedback on delivery and confidence</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="report-footer">
          <p>Report generated on {new Date(timestamp).toLocaleString()}</p>
          <p>AI Interview Coach Pro © 2026</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="report-actions">
        <button 
          className="action-btn primary" 
          onClick={downloadPDF}
          disabled={downloadingPDF}
        >
          {downloadingPDF ? 'Generating PDF...' : '📥 Download as PDF'}
        </button>
        <button 
          className="action-btn secondary" 
          onClick={downloadJSON}
        >
          📊 Download as JSON
        </button>
        <button 
          className="action-btn secondary" 
          onClick={downloadCSV}
        >
          📋 Download as CSV
        </button>
        <button 
          className="action-btn tertiary" 
          onClick={onRestart}
        >
          🔄 Start New Interview
        </button>
      </div>
    </div>
  );
};

export default InterviewReport;

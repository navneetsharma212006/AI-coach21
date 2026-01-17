import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import InterviewReport from './InterviewReport';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [jobRole, setJobRole] = useState('');
  const [company, setCompany] = useState('');
  const [experience, setExperience] = useState('2-4');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [maxDuration, setMaxDuration] = useState(90);
  const [mockMode, setMockMode] = useState(true);
  
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editedAnswer, setEditedAnswer] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [voiceRate, setVoiceRate] = useState(1);
  const [voicePitch, setVoicePitch] = useState(1);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  // New state for report page
  const [showReport, setShowReport] = useState(false);
  const [questionsData, setQuestionsData] = useState([]);
  
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const recordingStartRef = useRef(null);
  const finalTranscriptRef = useRef([]);
  const synthRef = useRef(window.speechSynthesis);

  const presets = [
    {
      label: 'Frontend @ Google (Mid)',
      value: { job: 'Frontend Engineer', company: 'Google', experience: '5-8', difficulty: 'medium' }
    },
    {
      label: 'Data Scientist @ Amazon (Junior)',
      value: { job: 'Data Scientist', company: 'Amazon', experience: '2-4', difficulty: 'hard' }
    },
    {
      label: 'PM @ Startup (Senior)',
      value: { job: 'Product Manager', company: 'Startup Inc.', experience: '9+', difficulty: 'hard' }
    }
  ];

  // Helper function to validate answer quality
  const validateAnswerQuality = (answer, question) => {
    const validations = [];
    
    // Length validation
    if (answer.length < 30) {
      validations.push('Answer too short (minimum 30 characters)');
    }
    
    // Word count validation
    const wordCount = answer.trim().split(/\s+/).length;
    if (wordCount < 10) {
      validations.push('Insufficient detail (minimum 10 words)');
    }
    
    // Check for repetitive content
    const words = answer.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words.filter(word => word.length > 3));
    const uniqueRatio = uniqueWords.size / words.length;
    
    if (uniqueRatio < 0.3) {
      validations.push('Answer appears repetitive');
    }
    
    // Question relevance check
    const questionKeywords = question.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 4)
      .filter(w => !['what', 'how', 'why', 'describe', 'explain'].includes(w));
    
    const answerLower = answer.toLowerCase();
    const relevantKeywords = questionKeywords.filter(keyword => 
      answerLower.includes(keyword)
    );
    
    if (questionKeywords.length > 0 && relevantKeywords.length < 1) {
      validations.push('Answer may not be relevant to the question');
    }
    
    // Check for nonsense patterns
    const nonsensePatterns = [
      /^(asdf|qwerty|test|testing|hello|hi|no|yes|okay|ok)\s*$/i,
      /^(\w+)\s+\1\s+\1\s+\1/, // Same word repeated 4+ times
      /^[^a-zA-Z0-9]*$/, // No alphanumeric characters
    ];
    
    if (nonsensePatterns.some(pattern => pattern.test(answer.trim()))) {
      validations.push('Answer appears to be nonsensical');
    }
    
    return validations;
  };

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptRef.current.push(transcript);
          } else {
            interim += transcript;
          }
        }
        const full = [...finalTranscriptRef.current, interim].join(' ').trim();
        setTranscription(full || 'Listening...');
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setStatus(`Speech recognition error: ${event.error}`);
        setIsError(true);
        stopListening();
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          const timeTaken = recordingStartRef.current ? Math.round((Date.now() - recordingStartRef.current) / 1000) : 0;
          if (transcription.length > 0) {
            setStatus('Recording finished. Review or analyze your answer.');
          } else {
            setStatus('Recording ended. No speech detected.');
            setIsError(true);
          }
          setIsListening(false);
        }
      };
    } else {
      setStatus('Speech recognition not supported in this browser. Please use Chrome.');
      setIsError(true);
    }

    // Load voices
    const loadVoices = () => {
      if (!synthRef.current) {
        console.error('Speech synthesis not available');
        return;
      }
      
      const availableVoices = synthRef.current.getVoices();
      console.log('Available voices:', availableVoices);
      setVoices(availableVoices);
      
      if (availableVoices.length > 0) {
        // Try to find English voices first
        const englishVoices = availableVoices.filter(v => 
          v.lang.includes('en') || v.name.toLowerCase().includes('english')
        );
        
        // Try to find female voices (usually better quality)
        const femaleVoices = englishVoices.filter(v => 
          v.name.toLowerCase().includes('female') || 
          v.name.toLowerCase().includes('zira') || 
          v.name.toLowerCase().includes('samantha')
        );
        
        let defaultVoice = '';
        if (femaleVoices.length > 0) {
          defaultVoice = femaleVoices[0].name;
        } else if (englishVoices.length > 0) {
          defaultVoice = englishVoices[0].name;
        } else {
          defaultVoice = availableVoices[0].name;
        }
        
        setSelectedVoice(defaultVoice);
        
        // Load saved settings
        const savedVoice = localStorage.getItem('ai_voice');
        if (savedVoice && availableVoices.some(v => v.name === savedVoice)) {
          setSelectedVoice(savedVoice);
        }
      }
    };
    
    loadVoices();
    
    // Some browsers load voices asynchronously
    setTimeout(loadVoices, 1000);
    
    if (synthRef.current) {
      synthRef.current.onvoiceschanged = loadVoices;
    }

    // Load other saved settings
    const savedRate = localStorage.getItem('ai_voice_rate');
    if (savedRate) setVoiceRate(parseFloat(savedRate));
    const savedPitch = localStorage.getItem('ai_voice_pitch');
    if (savedPitch) setVoicePitch(parseFloat(savedPitch));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speak = (text) => {
    if (!synthRef.current) {
      console.error('Speech synthesis not available');
      setStatus('Voice playback not available in this browser');
      setIsError(true);
      return;
    }
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice if available
    const voice = voices.find(v => v.name === selectedVoice);
    if (voice) {
      utterance.voice = voice;
      console.log('Using voice:', voice.name);
    } else if (voices.length > 0) {
      // Fallback to first available voice
      utterance.voice = voices[0];
      console.log('Using fallback voice:', voices[0].name);
    }
    
    // Set rate and pitch
    utterance.rate = voiceRate;
    utterance.pitch = voicePitch;
    
    // Add event listeners for better control
    utterance.onstart = () => {
      console.log('Speech started:', text.substring(0, 50) + '...');
    };
    
    utterance.onend = () => {
      console.log('Speech ended');
    };
    
    utterance.onerror = (event) => {
      console.error('Speech error:', event.error);
      setStatus('Voice playback error: ' + event.error);
      setIsError(true);
    };
    
    // Speak the text
    synthRef.current.speak(utterance);
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setStatus('Speech recognition not initialized');
      setIsError(true);
      return;
    }
    
    try {
      finalTranscriptRef.current = [];
      setTranscription('');
      setAnalysis(null);
      recordingStartRef.current = Date.now();
      recognitionRef.current.start();
      setIsListening(true);
      setStatus('Listening... Speak your answer');
      setIsError(false);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopListening();
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      setStatus('Failed to start recording: ' + error.message);
      setIsError(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleInitialInteraction = () => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      // Test voice functionality with a short welcome
      setTimeout(() => {
        speak('Welcome to AI Interview Coach. Generate questions to begin.');
      }, 500);
    }
  };

  const handleGenerateQuestions = async () => {
    handleInitialInteraction();
    
    if (!jobRole.trim()) {
      setStatus('Please enter a job role');
      setIsError(true);
      return;
    }

    setIsGenerating(true);
    setStatus('Generating interview questions...');
    setIsError(false);

    try {
      const response = await axios.post(`${API_URL}/generate-questions`, {
        jobRole,
        company,
        numQuestions,
        difficulty,
        experience,
        mock: mockMode
      });

      if (response.data.questions && response.data.questions.length > 0) {
        setQuestions(response.data.questions);
        setCurrentIndex(0);
        setStatus(`Generated ${response.data.questions.length} questions successfully!`);
        setAnalysis(null);
        setTranscription('');
        setQuestionsData([]);
        setShowReport(false);
        
        // Speak the first question after a short delay
        setTimeout(() => {
          if (response.data.questions[0]) {
            speak(`Question 1: ${response.data.questions[0]}`);
          }
        }, 800);
      } else {
        throw new Error('No questions received');
      }
    } catch (error) {
      setStatus('Failed to generate questions: ' + error.message);
      setIsError(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnalyzeAnswer = async () => {
    const answer = showEdit ? editedAnswer : transcription;
    
    // Enhanced validation for answer quality
    if (answer.length < 30) {
      setStatus('Answer too short. Provide a more detailed response (minimum 30 characters).');
      setIsError(true);
      return;
    }
    
    const wordCount = answer.trim().split(/\s+/).length;
    if (wordCount < 10) {
      setStatus('Answer too brief. Try to elaborate more (minimum 10 words).');
      setIsError(true);
      return;
    }
    
    // Validate answer quality before sending to backend
    const validations = validateAnswerQuality(answer, questions[currentIndex]);
    if (validations.length > 2) {
      setStatus(`Answer quality issues: ${validations.slice(0, 2).join(', ')}`);
      setIsError(true);
      return;
    }

    setIsAnalyzing(true);
    setStatus('Analyzing your answer deeply...');
    setIsError(false);

    try {
      const timeTaken = recordingTime;
      
      // Enhanced analysis request with strict parameters
      const response = await axios.post(`${API_URL}/analyze`, {
        question: questions[currentIndex],
        answer,
        timeTaken,
        mock: mockMode,
        jobRole,
        company,
        experience,
        difficulty,
        
        // Enhanced analysis parameters
        analysisDepth: 'deep',
        scoringConfig: {
          strictness: 'high',
          minScoreThreshold: 3,
          requireExamples: difficulty !== 'easy',
          requireTechnicalDepth: experience !== '0-1',
          evaluateStructure: true,
          checkRelevance: true,
          assessClarity: true,
          checkConciseness: true,
          requireSpecifics: true
        },
        
        // Context for better evaluation
        context: {
          jobLevel: experience,
          questionDifficulty: difficulty,
          expectedAnswerLength: difficulty === 'hard' ? 'detailed' : 'moderate'
        }
      });

      if (!response.data || typeof response.data.score !== 'number') {
        throw new Error('Invalid analysis response from server');
      }

      const questionData = {
        question: questions[currentIndex],
        answer,
        score: response.data.score,
        feedback: response.data.feedback,
        suggestion: response.data.betterAnswer,
        timeTaken,
        detailedScores: response.data.detailedScores || {},
        areasForImprovement: response.data.areasForImprovement || [],
        strengths: response.data.strengths || []
      };

      setQuestionsData([...questionsData, questionData]);
      setAnalysis(response.data);
      
      // Provide specific feedback based on score
      let scoreMessage = '';
      let scoreClass = '';
      if (response.data.score >= 8) {
        scoreMessage = 'Excellent answer!';
        scoreClass = 'high-score';
      } else if (response.data.score >= 6) {
        scoreMessage = 'Good answer with room for improvement.';
        scoreClass = 'medium-score';
      } else if (response.data.score >= 4) {
        scoreMessage = 'Average answer. Consider revising.';
        scoreClass = 'medium-score';
      } else {
        scoreMessage = 'Needs significant improvement.';
        scoreClass = 'low-score';
      }
      
      setStatus(`Analysis complete! ${scoreMessage}`);
      
      // Speak the feedback
      const feedbackToSpeak = `Score ${response.data.score} out of 10. ${response.data.feedback.substring(0, 100)}`;
      speak(feedbackToSpeak);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setStatus('Failed to analyze answer: ' + (error.response?.data?.message || error.message));
      setIsError(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setTranscription('');
      setAnalysis(null);
      setShowEdit(false);
      setEditedAnswer('');
      
      // Speak the next question after a brief delay
      setTimeout(() => {
        if (questions[nextIndex]) {
          speak(`Question ${nextIndex + 1}: ${questions[nextIndex]}`);
        }
      }, 300);
      
      setStatus('Next question ready. Press Start Speaking when ready.');
    } else {
      // Interview completed - show report
      setStatus('Congratulations! Interview session completed. Generating your detailed report...');
      speak("Great job! You've completed the interview session.");
      setShowReport(true);
    }
  };

  const handleRetake = () => {
    setTranscription('');
    setAnalysis(null);
    setShowEdit(false);
    setEditedAnswer('');
    startListening();
  };

  const handlePresetSelect = (presetValue) => {
    const preset = JSON.parse(presetValue);
    setJobRole(preset.job);
    setCompany(preset.company);
    setExperience(preset.experience);
    setDifficulty(preset.difficulty);
    handleInitialInteraction();
  };

  const handleVoicePreview = () => {
    localStorage.setItem('ai_voice', selectedVoice);
    localStorage.setItem('ai_voice_rate', voiceRate.toString());
    localStorage.setItem('ai_voice_pitch', voicePitch.toString());
    speak('This is a preview of the selected voice. You can adjust the rate and pitch settings.');
  };

  const handleExport = () => {
    const sessionData = {
      generatedAt: new Date().toISOString(),
      jobRole,
      company,
      experience,
      difficulty,
      questions,
      questionsData,
      analysis
    };
    
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-session-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setStatus('Session exported successfully!');
    speak('Session exported successfully.');
  };

  const handleRestart = () => {
    setShowReport(false);
    setQuestions([]);
    setCurrentIndex(-1);
    setTranscription('');
    setAnalysis(null);
    setQuestionsData([]);
    setStatus('Ready to start a new interview session');
    setJobRole('');
    setCompany('');
    speak('Ready for a new interview session. Enter a job role to begin.');
  };

  const progressPercentage = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const wordCount = transcription.trim().split(/\s+/).filter(word => word.length > 0).length;

  // Show report page if interview is completed
  if (showReport && questionsData.length > 0) {
    return (
      <InterviewReport 
        sessionData={{
          jobRole,
          company,
          experience,
          difficulty,
          timestamp: new Date().toISOString(),
          questionsData
        }}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <div className="app-container">
      <div className="container">
        <header>
          <h1>AI Interview Coach Pro</h1>
          <div className="subtitle">Voice-Powered • Gemini Flash • 2026 Edition</div>
          <div className="header-description">
            Enter the role and optional company, choose experience and difficulty, then generate practice questions. Use the voice recorder to answer each and get instant feedback.
          </div>
        </header>

        <div className="content">
          <div className="presets-row">
            <label>Presets</label>
            <select 
              className="preset-select"
              onChange={(e) => handlePresetSelect(e.target.value)}
              defaultValue=""
            >
              <option value="">-- choose preset --</option>
              {presets.map((preset, index) => (
                <option key={index} value={JSON.stringify(preset.value)}>
                  {preset.label}
                </option>
              ))}
            </select>
            <label className="mock-mode-label">
              <input 
                type="checkbox" 
                checked={mockMode}
                onChange={(e) => setMockMode(e.target.checked)}
              />
              Mock Mode
            </label>
          </div>

          <div className="input-group">
            <label htmlFor="voice-select">Voice / Playback</label>
            <div className="voice-controls">
              <select 
                id="voice-select"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
              >
                {voices.length > 0 ? (
                  voices.map((voice, index) => (
                    <option key={index} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))
                ) : (
                  <option value="">No voices available</option>
                )}
              </select>
              <button className="preview-btn" onClick={handleVoicePreview}>
                Preview
              </button>
              <button 
                className="test-voice-btn"
                onClick={() => speak('Testing voice functionality. Can you hear me?')}
                style={{ marginLeft: '10px', padding: '5px 10px' }}
              >
                Test Voice
              </button>
            </div>
            <div className="voice-sliders">
              <div className="slider-group">
                <label>Rate: {voiceRate.toFixed(2)}</label>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2" 
                  step="0.05" 
                  value={voiceRate}
                  onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                />
              </div>
              <div className="slider-group">
                <label>Pitch: {voicePitch.toFixed(2)}</label>
                <input 
                  type="range" 
                  min="0" 
                  max="2" 
                  step="0.05" 
                  value={voicePitch}
                  onChange={(e) => setVoicePitch(parseFloat(e.target.value))}
                />
              </div>
            </div>
            {voices.length === 0 && (
              <div className="warning-message">
                <strong>Voice playback not available:</strong>
                <p>Your browser may not support speech synthesis. Try using Chrome or Edge.</p>
              </div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="job-role">Job Role / Position</label>
            <input
              id="job-role"
              type="text"
              placeholder="e.g. Full Stack Developer, Data Scientist, Product Manager"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="company">Target Company (optional)</label>
            <input
              id="company"
              type="text"
              placeholder="e.g. Google, Amazon, Startup Inc."
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <div className="input-hint">
              Optional: helps tailor questions to company culture and role expectations.
            </div>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label htmlFor="experience">Years of Experience</label>
              <select 
                id="experience"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
              >
                <option value="0-1">0-1 years (Entry)</option>
                <option value="2-4">2-4 years (Junior)</option>
                <option value="5-8">5-8 years (Mid)</option>
                <option value="9+">9+ years (Senior)</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="difficulty">Difficulty</label>
              <select 
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="limit">Question Limit</label>
              <input
                id="limit"
                type="number"
                min="1"
                max="20"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value) || 5)}
              />
              <div className="input-hint">Max 20 questions per session.</div>
            </div>

            <div className="input-group">
              <label htmlFor="max-duration">Max Record (s)</label>
              <input
                id="max-duration"
                type="number"
                min="5"
                max="300"
                value={maxDuration}
                onChange={(e) => setMaxDuration(parseInt(e.target.value) || 90)}
              />
              <div className="input-hint">Auto-stop after this many seconds.</div>
            </div>
          </div>

          <button 
            className="generate-btn"
            onClick={handleGenerateQuestions}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Interview Questions'}
          </button>

          <div className={`status ${isError ? 'error' : ''}`}>
            {status}
          </div>

          {questions.length > 0 && currentIndex >= 0 && (
            <div className="interview-area">
              {isAnalyzing && (
                <div className="spinner-overlay">
                  <div className="spinner"></div>
                  <div>Analyzing your answer deeply...</div>
                </div>
              )}

              <div className="progress-container">
                <div className="progress-label">
                  Progress: {currentIndex + 1} of {questions.length} questions
                </div>
                <div 
                  className="progress-bar" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>

              <div className="question-card">
                <strong>
                  Question {currentIndex + 1}/{questions.length}:
                </strong>
                <div className="question-text">{questions[currentIndex]}</div>
                <button 
                  className="repeat-question-btn"
                  onClick={() => speak(`Question ${currentIndex + 1}: ${questions[currentIndex]}`)}
                >
                  🔊 Repeat Question
                </button>
              </div>

              <div className="label">Your Answer (live transcription)</div>
              <div className="transcription-box">
                {transcription || 'Press "Start Speaking" when ready...'}
                {transcription && (
                  <div className="answer-stats">
                    <span className="stat">{wordCount} words</span>
                    <span className="stat">{transcription.length} characters</span>
                    <span className="stat">{recordingTime}s speaking time</span>
                  </div>
                )}
              </div>

              {transcription && !isListening && !analysis && (
                <>
                  <div className="answer-quality-preview">
                    <div className="label">Answer Quality Check:</div>
                    <div className="quality-indicators">
                      <div className={`quality-item ${transcription.length >= 50 ? 'good' : 'poor'}`}>
                        Length: {transcription.length >= 50 ? '✓ Good' : '⚠ Too short'} ({transcription.length} chars)
                      </div>
                      <div className={`quality-item ${wordCount >= 15 ? 'good' : 'poor'}`}>
                        Detail: {wordCount >= 15 ? '✓ Good' : '⚠ Needs more'} ({wordCount} words)
                      </div>
                      <div className="quality-hint">
                        {wordCount < 15 ? 'Tip: Provide specific examples and details' : 'Good level of detail!'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="review-controls">
                    <button className="analyze-btn" onClick={handleAnalyzeAnswer}>
                      Analyze Answer
                    </button>
                    <button className="retake-btn" onClick={handleRetake}>
                      Retake
                    </button>
                    <button className="edit-btn" onClick={() => setShowEdit(!showEdit)}>
                      Edit
                    </button>
                    <button className="export-btn" onClick={handleExport}>
                      Export Session
                    </button>
                  </div>
                </>
              )}

              {showEdit && (
                <div className="edit-area">
                  <textarea
                    value={editedAnswer}
                    onChange={(e) => setEditedAnswer(e.target.value)}
                    placeholder="Edit your answer here..."
                    rows={4}
                  />
                </div>
              )}

              <div className="controls">
                <button
                  className={`voice-btn ${isListening ? 'recording' : ''}`}
                  onClick={isListening ? stopListening : startListening}
                  disabled={isAnalyzing}
                >
                  {isListening ? 'Stop & Analyze' : 'Start Speaking'}
                </button>
                <button
                  className="next-btn"
                  onClick={handleNextQuestion}
                  disabled={!analysis}
                >
                  {currentIndex >= questions.length - 1 ? '✓ Complete Interview' : 'Next Question →'}
                </button>
              </div>

              <div className="recording-info">
                {isListening && <div className="rec-indicator">●</div>}
                <div className="rec-timer">
                  {recordingTime}s / {maxDuration}s
                </div>
              </div>

              {analysis && (
                <div className="results-area">
                  <div className={`score-box ${
                    analysis.score >= 8 ? 'high-score' : 
                    analysis.score >= 5 ? 'medium-score' : 
                    'low-score'
                  }`}>
                    Score: {analysis.score}/10
                    {analysis.score >= 8 && <span className="score-label"> - Excellent</span>}
                    {analysis.score >= 5 && analysis.score < 8 && <span className="score-label"> - Good</span>}
                    {analysis.score < 5 && <span className="score-label"> - Needs Improvement</span>}
                  </div>

                  {analysis.detailedScores && Object.keys(analysis.detailedScores).length > 0 && (
                    <div className="detailed-scores">
                      <div className="label">Detailed Breakdown:</div>
                      <div className="score-breakdown">
                        {Object.entries(analysis.detailedScores).map(([key, value]) => (
                          <div key={key} className="score-item">
                            <span className="score-label">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span className="score-value">{value}/10</span>
                            <div className="score-bar">
                              <div className="score-fill" style={{ width: `${value * 10}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="label">Expert Feedback</div>
                  <p className="feedback">{analysis.feedback}</p>

                  {analysis.strengths && analysis.strengths.length > 0 && (
                    <>
                      <div className="label">Strengths</div>
                      <ul className="strengths-list">
                        {analysis.strengths.map((strength, index) => (
                          <li key={index}>✓ {strength}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  {analysis.areasForImprovement && analysis.areasForImprovement.length > 0 && (
                    <>
                      <div className="label">Areas for Improvement</div>
                      <ul className="improvement-list">
                        {analysis.areasForImprovement.map((area, index) => (
                          <li key={index}>• {area}</li>
                        ))}
                      </ul>
                    </>
                  )}

                  <div className="label">Stronger Answer Example</div>
                  <div className="better-answer">{analysis.betterAnswer}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
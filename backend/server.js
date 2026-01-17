import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

app.post("/generate-questions", async (req, res) => {
  console.log(">>> Generating questions for:", req.body.jobRole);
  
  try {
    const { jobRole, company = "", numQuestions = 5, difficulty = "medium", experience = "" } = req.body;
    const limit = Math.max(1, Math.min(20, parseInt(numQuestions) || 5));
    
    if (!process.env.GEMINI_API_KEY) {
      console.error("Error: GEMINI_API_KEY environment variable is not set.");
      return res.status(500).json({ 
        questions: [],
        error: "API key is not configured. Please set GEMINI_API_KEY environment variable."
      });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    const model = "gemini-3-flash-preview"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    const prompt = `
      You are a professional interview coach. Generate exactly ${limit} ${difficulty} level interview questions for the job role: "${jobRole}"${company ? ' targeting the company: "' + company + '"' : ''}${experience ? ' for a candidate with ' + experience + ' experience' : ''}.
      Include a mix of behavioral, situational, and technical questions relevant to the role and company context. Keep them realistic and varied.
      Return ONLY a JSON object with a single field "questions" containing an array of strings, for example:
      {
        "questions": ["question1", "question2", ..., "question${limit}"]
      }
    `;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("API Error:", data.error.message);
      return res.status(500).json({ questions: [] });
    }

    const aiResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponseText) {
      return res.status(500).json({ questions: [] });
    }

    const cleanJson = aiResponseText.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleanJson);
    
    res.json(result);
    console.log(">>> Questions generated successfully.");

  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ questions: [] });
  }
});

app.post("/analyze", async (req, res) => {
  console.log(">>> Analyzing answer...");
  
  try {
    const { question, answer, timeTaken, jobRole = "" } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      console.error("Error: GEMINI_API_KEY environment variable is not set.");
      return res.status(500).json({ 
        score: 0, 
        feedback: "API key is not configured. Please set GEMINI_API_KEY environment variable.", 
        betterAnswer: "" 
      });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    const model = "gemini-3-flash-preview"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    const prompt = `
      You are a STRICT expert interview coach. Your job is to evaluate how well the candidate answered the question. Be critical and fair.
      
      QUESTION: "${question}"
      ANSWER: "${answer}"
      TIME TAKEN: ${timeTaken} seconds
      JOB ROLE: ${jobRole || 'General'}
      
      STRICT EVALUATION CRITERIA:
      1. RELEVANCE (35%): Does the answer directly address the question? Is it on-topic? Score 0-3.
      2. DEPTH & EXAMPLES (30%): Does it include specific examples, metrics, or technical details? Score 0-3.
      3. STRUCTURE & CLARITY (20%): Is it well-organized and easy to follow? Score 0-2.
      4. PROFESSIONALISM (15%): Does it sound professional and confident? Score 0-1.5.
      
      CRITICAL RULES:
      - If answer is completely irrelevant to question (talking about different topic), score MAXIMUM 2/10.
      - If answer is vague, generic, or lacks any real examples, score MAXIMUM 4/10.
      - If answer has no concrete details, metrics, or experiences, score MAXIMUM 5/10.
      - Only give scores 8-10 if answer is highly relevant, includes specific examples, and demonstrates real knowledge.
      - Nonsense or off-topic answers should get low scores (1-3/10).
      
      Calculate final score out of 10 using the scoring criteria above.
      
      Return ONLY valid JSON (no markdown, no extra text):
      {
        "score": [INTEGER 0-10],
        "feedback": "[2-3 sentence feedback highlighting strengths and critical weaknesses]",
        "betterAnswer": "[A strong example answer that properly addresses the question with specific details]"
      }
    `;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
      console.error("API Error:", data.error.message);
      return res.status(500).json({ 
        score: 0, 
        feedback: `Error: ${data.error.message}`, 
        betterAnswer: "" 
      });
    }

    const aiResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponseText) {
      return res.status(500).json({ score: 0, feedback: "Empty response from AI.", betterAnswer: "" });
    }

    const cleanJson = aiResponseText.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleanJson);
    
    res.json(result);
    console.log(">>> Analysis completed successfully.");

  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ score: 0, feedback: "Server error: " + error.message, betterAnswer: "" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "AI Interview Coach API is running" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
});
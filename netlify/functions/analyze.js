export const handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { question, answer, timeTaken, jobRole = "" } = body;

    if (!process.env.GEMINI_API_KEY) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          score: 0,
          feedback: "API key is not configured.",
          betterAnswer: "",
        }),
      };
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    const model = "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    const prompt = `
      You are a STRICT expert interview coach. Your job is to evaluate how well the candidate answered the question. Be critical and fair.
      
      QUESTION: "${question}"
      ANSWER: "${answer}"
      TIME TAKEN: ${timeTaken} seconds
      JOB ROLE: ${jobRole || "General"}
      
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
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("API Error:", data.error.message);
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          score: 0,
          feedback: `Error: ${data.error.message}`,
          betterAnswer: "",
        }),
      };
    }

    const aiResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponseText) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          score: 0,
          feedback: "Empty response from AI.",
          betterAnswer: "",
        }),
      };
    }

    const cleanJson = aiResponseText.replace(/```json|```/g, "").trim();
    const result = JSON.parse(cleanJson);

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Server Error:", error.message);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        score: 0,
        feedback: "Server error: " + error.message,
        betterAnswer: "",
      }),
    };
  }
};

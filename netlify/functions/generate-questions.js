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
    const { jobRole, company = "", numQuestions = 5, difficulty = "medium", experience = "" } = body;
    const limit = Math.max(1, Math.min(20, parseInt(numQuestions) || 5));

    if (!process.env.GEMINI_API_KEY) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          questions: [],
          error: "API key is not configured.",
        }),
      };
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    const model = "gemini-1.5-flash";
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
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("API Error:", data.error.message);
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ questions: [] }),
      };
    }

    const aiResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponseText) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ questions: [] }),
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
      body: JSON.stringify({ questions: [], error: error.message }),
    };
  }
};

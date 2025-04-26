require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Gemini API with error handling
let genAI;
let model;
try {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY in environment variables");
  }
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
} catch (error) {
  console.error("Failed to initialize Gemini AI:", error);
}

/**
 * Generate admin reply suggestions based on customer feedback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAIReply = async (req, res) => {
  // Input validation
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { feedbackText } = req.body;

  if (!feedbackText || typeof feedbackText !== 'string' || feedbackText.trim().length === 0) {
    return res.status(400).json({ error: "Missing or invalid feedbackText" });
  }

  try {
    // Check if model is initialized
    if (!model) {
      throw new Error("AI model not initialized");
    }

    // Crafted prompt to generate the best possible admin reply
    const prompt = `
You are an experienced customer support admin reviewing user feedback. Generate a concise, professional response that:

1. Acknowledges the specific points mentioned in the feedback
2. Shows empathy and understanding
3. Suggests specific actions or solutions when appropriate
4. Maintains a professional, helpful tone
5. Avoids generic phrases like "According to your feedback" or "Thank you for your feedback"
6. Is brief but specific (1-3 sentences max)

The reply should be directly usable by an admin without further editing.

Customer Feedback: "${feedbackText.trim().replace(/"/g, '\\"')}"
    `.trim();

    // Request with optimized parameters for admin-style responses
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.3,  // Lower temperature for more consistent, professional responses
        topP: 0.85,
        topK: 30
      }
    });

    const response = result.response;
    const text = response.text().trim();

    // Return the AI-generated admin reply suggestion
    res.json({ 
      reply: text,
      status: "success",
      metrics: {
        responseLength: text.length,
        processingTime: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error("AI processing error:", error);
    
    res.status(500).json({
      error: "Failed to generate admin reply",
      status: "error",
      suggestion: "Please try again or craft a manual response"
    });
  }
};

// Add a function to analyze feedback sentiment
exports.analyzeFeedbackSentiment = async (feedbackText) => {
  if (!model) return null;
  
  try {
    const sentimentPrompt = `
Analyze the following customer feedback and return only a JSON object with these fields:
- sentiment: (positive, neutral, or negative)
- urgency: (low, medium, or high)
- mainTopic: (brief 1-2 word description)

Customer Feedback: "${feedbackText.trim().replace(/"/g, '\\"')}"

Return ONLY the JSON object with no additional text or explanation.
    `.trim();
    
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: sentimentPrompt }] }],
      generationConfig: { temperature: 0.1 }
    });
    
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return null;
  }
};

// Health check endpoint
exports.healthCheck = (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    service: "admin-reply-generator",
    aiModelStatus: model ? "initialized" : "unavailable" 
  });
};
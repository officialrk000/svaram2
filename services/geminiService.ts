
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMusicRecommendation = async (moodPrompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The user says: "${moodPrompt}". Based on this mood or request, act as a professional DJ for the Svaram music app. Suggest a musical direction. Return a JSON object with mood, reason, and suggestedGenre.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mood: { type: Type.STRING },
            reason: { type: Type.STRING },
            suggestedGenre: { type: Type.STRING },
          },
          required: ["mood", "reason", "suggestedGenre"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Recommendation Error:", error);
    return null;
  }
};

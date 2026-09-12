
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

async function testModel() {
  if (!apiKey) {
    console.error("No API key found in .env.local");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = "gemini-2.5-flash"; // The model name the user wants
  
  console.log(`Testing model: ${modelName}...`);
  
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello, are you functional?");
    const response = await result.response;
    const text = response.text();
    console.log("Success! Response:", text);
  } catch (err: any) {
    console.error("Failed to use model:", modelName);
    console.error("Error Message:", err.message);
    
    // Try a fallback to see if it's just this model
    console.log(`\nChecking fallback model (gemini-1.5-flash)...`);
    try {
      const fallbackModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const fallbackResult = await fallbackModel.generateContent("Hello?");
      console.log("Fallback model is working.");
    } catch (fallbackErr: any) {
      console.error("Fallback also failed. Possible API Key issue?", fallbackErr.message);
    }
  }
}

testModel();

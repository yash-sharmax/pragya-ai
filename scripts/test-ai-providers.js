import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

dotenv.config();

const clean = (val) => (val || '').trim().replace(/^["']|["']$/g, '');

async function testGemini() {
  try {
    const apiKey = clean(process.env.GEMINI_API_KEY);
    let modelName = clean(process.env.GEMINI_MODEL) || 'gemini-1.5-flash';
    // If modelName is gemini-3.8-flash (which doesn't exist yet on Google AI API, valid models are gemini-1.5-flash, gemini-1.5-pro, gemini-2.0-flash-exp),
    // let's check
    console.log('Testing Gemini with model:', modelName);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Say "Pragya Gemini Active" in 3 words.');
    const response = await result.response;
    console.log('Gemini Status: OK! Output:', response.text().trim());
  } catch (err) {
    console.error('Gemini Test Error:', err.message);
  }
}

async function testGroq() {
  try {
    const apiKey = clean(process.env.GROQ_API_KEY);
    const modelName = clean(process.env.GROQ_MODEL) || 'llama-3.3-70b-versatile';
    console.log('Testing Groq with model:', modelName);
    const groq = new Groq({ apiKey });
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say "Pragya Groq Active" in 3 words.' }],
      model: modelName,
    });
    console.log('Groq Status: OK! Output:', chatCompletion.choices[0]?.message?.content?.trim());
  } catch (err) {
    console.error('Groq Test Error:', err.message);
  }
}

async function run() {
  console.log('Testing AI providers with cleaned strings...');
  await testGemini();
  await testGroq();
}

run();

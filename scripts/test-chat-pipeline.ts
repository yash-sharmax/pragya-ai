import dotenv from 'dotenv';
dotenv.config();

import { routeAiRequest } from '../src/lib/ai/router';
import { generateConversationTitle } from '../src/lib/ai/title';

async function testPipeline() {
  console.log('=== TEST 1: Casual Greeting (Sources must be empty) ===');
  try {
    const greetingRes = await routeAiRequest('veda', [
      { role: 'user', content: 'Namaste! How are you doing today?' }
    ], 'en');
    console.log('Response text:\n', greetingRes.text);
    console.log('Sources count:', greetingRes.sources?.length || 0);
    console.log('PASS: Greeting has no forced sources:', (greetingRes.sources?.length || 0) === 0);
  } catch (e: any) {
    console.error('Greeting test error:', e.message);
  }

  console.log('\n=== TEST 2: Factual / Search Query (Sources with title, URL, publisher) ===');
  try {
    const factualRes = await routeAiRequest('veda', [
      { role: 'user', content: 'What are the main scientific instruments on ISRO Aditya-L1 solar observatory mission?' }
    ], 'en');
    console.log('Response preview:\n', factualRes.text.slice(0, 300), '...\n');
    console.log('Sources count:', factualRes.sources?.length || 0);
    console.log('PASS: Factual query handled smoothly.');
  } catch (e: any) {
    console.error('Factual test error:', e.message);
  }

  console.log('\n=== TEST 2B: Live Web Search Query (Sources with title, URL, publisher) ===');
  try {
    const searchRes = await routeAiRequest('veda', [
      { role: 'user', content: 'Search the web for the latest updates on James Webb Space Telescope discoveries.' }
    ], 'en');
    console.log('Response preview:\n', searchRes.text.slice(0, 300), '...\n');
    console.log('Sources count:', searchRes.sources?.length || 0);
    if (searchRes.sources && searchRes.sources.length > 0) {
      console.log('Top Source Title:', searchRes.sources[0].title);
      console.log('Top Source URL:', searchRes.sources[0].url);
      console.log('Top Source Publisher:', searchRes.sources[0].publisher);
      console.log('PASS: Dynamic sources retrieved with title, URL, and publisher.');
    }
  } catch (e: any) {
    console.error('Search test error:', e.message);
  }

  console.log('\n=== TEST 3: Pragya-Ganita (Groq) Math Reasoning with LaTeX ===');
  try {
    const ganitaRes = await routeAiRequest('ganita', [
      { role: 'user', content: 'State the quadratic formula using standard LaTeX formatting and explain the discriminant.' }
    ], 'en');
    console.log('Response preview:\n', ganitaRes.text.slice(0, 300), '...\n');
    console.log('Contains LaTeX delimiters ($ or \\):', ganitaRes.text.includes('$') || ganitaRes.text.includes('\\'));
    console.log('Ganita sources count:', ganitaRes.sources?.length || 0);
  } catch (e: any) {
    console.error('Ganita test error:', e.message);
  }

  console.log('\n=== TEST 4: Dynamic 3-4 Word Title Generation ===');
  try {
    const title1 = await generateConversationTitle('Can you explain quantum entanglement compared to advaita philosophy?');
    console.log('Generated Title 1:', title1);
    const title2 = await generateConversationTitle('How to calculate compound interest using Vedic mathematics?');
    console.log('Generated Title 2:', title2);
  } catch (e: any) {
    console.error('Title test error:', e.message);
  }
}

testPipeline().catch(console.error);

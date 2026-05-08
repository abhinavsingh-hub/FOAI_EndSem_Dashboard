import { HfInference } from '@huggingface/inference';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { context, userMsg } = req.body;
    
    // Safely get the token from Vercel's securely injected environment variable
    const token = process.env.VITE_AI_TOKEN;
    const hf = new HfInference(token);

    const result = await hf.chatCompletion({
      model: 'Qwen/Qwen2.5-72B-Instruct',
      messages: [
        { role: 'system', content: context },
        { role: 'user', content: userMsg }
      ],
      max_tokens: 250,
      temperature: 0.1,
    });

    return res.status(200).json({ text: result.choices[0].message.content });
  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to connect to Hugging Face API' });
  }
}

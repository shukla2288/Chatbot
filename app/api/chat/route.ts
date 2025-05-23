import { CohereClient } from 'cohere-ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();

  if (!process.env.COHERE_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing Cohere API key" }), { status: 500 });
  }

  try {
    const cohere = new CohereClient({
      token: process.env.COHERE_API_KEY,
    });

    // Convert messages to a single prompt string
    const prompt = messages.map((msg: any) => 
      `${msg.role === 'assistant' ? 'Assistant' : 'Human'}: ${msg.content}`
    ).join('\n\n') + '\n\nAssistant:';

    const response = await cohere.generate({
      prompt,
      model: 'command',
      maxTokens: 1000,
      temperature: 0.7,
      k: 0,
      stopSequences: ['Human:'],
      returnLikelihoods: 'NONE',
  });

    return new Response(JSON.stringify({
      choices: [{
        message: {
          content: response.generations[0].text.trim(),
          role: 'assistant'
        }
      }]
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('API call failed:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
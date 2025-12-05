import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    const { messages, model = 'gpt-4o-mini', temperature = 0.7, max_tokens = 2000 } = await req.json() as ChatRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // If no API key, return demo response
    if (!openaiApiKey) {
      const demoResponses = [
        'I understand your question. As a legal AI assistant, I can help you analyze contracts and provide legal insights. However, this is a demo environment - please configure your OpenAI API key to enable full AI capabilities.',
        'Thank you for your question. In a production environment with a configured API key, I would provide detailed legal analysis. For now, this is a demonstration response showing how the LegalAI system would work.',
        'I can see you are asking about legal matters. This demo shows the interface and workflow of LegalAI. To get actual AI-powered responses, please add your OpenAI API key to the environment configuration.',
      ];

      const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];

      return new Response(
        JSON.stringify({
          message: randomResponse,
          usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const systemMessage: ChatMessage = {
      role: 'system',
      content: 'You are a helpful legal AI assistant specializing in contract review, drafting, and legal research. Provide clear, professional, and accurate legal information. Always remind users to consult with a qualified attorney for specific legal advice.'
    };

    const allMessages = [systemMessage, ...messages];

    // GPT-5 and o1/o3 models have different parameter requirements
    const isGPT5OrNewer = model.startsWith('gpt-5') || model.startsWith('o1') || model.startsWith('o3');
    const requestBody: any = {
      model,
      messages: allMessages,
    };

    // GPT-5 and reasoning models don't support temperature adjustment
    if (!isGPT5OrNewer) {
      requestBody.temperature = temperature;
    }

    // GPT-5 and newer models use max_completion_tokens instead of max_tokens
    if (isGPT5OrNewer) {
      requestBody.max_completion_tokens = max_tokens;
    } else {
      requestBody.max_tokens = max_tokens;
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      console.error('OpenAI API error:', error);
      return new Response(
        JSON.stringify({ error: 'OpenAI API request failed', details: error }),
        {
          status: openaiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const data = await openaiResponse.json();

    return new Response(
      JSON.stringify({
        message: data.choices[0].message.content,
        usage: data.usage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in openai-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.includes('/api/') && request.method === 'POST') {
      return handleApi(request, env, url);
    }

    return env.ASSETS.fetch(request);
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

async function handleApi(request, env, url) {
  const path = url.pathname.replace(/\/$/, '');

  if (!path.endsWith('/api/generate-caption')) {
    return json({ error: 'Not found' }, 404);
  }

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const { success } = await env.AI_RATE_LIMITER.limit({ key: 'caption:' + ip });

  if (!success) {
    return json({
      error: 'Too many requests. Please wait a minute and try again.',
      code: 'RATE_LIMITED'
    }, 429);
  }

  return handleGenerate(request, env);
}

const PLATFORM_PROMPTS = {
  instagram: 'Write for Instagram. 1-3 short sentences, then a blank line, then 8-12 relevant hashtags. Conversational and visual.',
  twitter: 'Write for X (Twitter). Under 280 characters total, including hashtags. Punchy, opinionated, or witty. Use at most 2 hashtags.',
  linkedin: 'Write for LinkedIn. 2-4 sentences. Professional, insightful, and thoughtful. No more than 3 hashtags. Avoid emojis unless natural.',
  facebook: 'Write for Facebook. 1-3 sentences. Friendly and community-oriented. Ask a question at the end to drive engagement.',
  tiktok: 'Write for TikTok. Very short, energetic, hook-driven. 1-2 sentences, then 5-7 hashtags. Sound like a creator, not a brand.',
  generic: 'Write a general social media caption. 1-3 sentences, plus 5-8 relevant hashtags.'
};

const TONE_PROMPTS = {
  casual: 'Casual and conversational. Contractions, natural language, no corporate speak.',
  professional: 'Professional and credible. Clear, confident, no hype.',
  humorous: 'Lighthearted with a touch of humor. Keep it tasteful and on-brand.',
  inspirational: 'Uplifting and motivational. Aim to resonate emotionally without being saccharine.',
  educational: 'Informative and useful. Teach the reader something in a compact form.'
};

async function handleGenerate(request, env) {
  try {
    const body = await request.json();
    const topic = (body.topic || '').trim();
    const platform = body.platform || 'instagram';
    const tone = body.tone || 'casual';
    const details = (body.details || '').trim();

    if (!topic || topic.length < 5) {
      return json({ error: 'Topic must be at least 5 characters.' }, 400);
    }

    const systemPrompt = 'You are a social media copywriter. You output ONLY the captions. No preamble, no explanations.';

    let userPrompt = 'Topic: ' + topic + '\n';
    if (details) userPrompt += 'Additional details: ' + details.slice(0, 500) + '\n';
    userPrompt += '\n';

    userPrompt += 'Instructions:\n';
    userPrompt += '- Platform: ' + (PLATFORM_PROMPTS[platform] || PLATFORM_PROMPTS.generic) + '\n';
    userPrompt += '- Tone: ' + (TONE_PROMPTS[tone] || TONE_PROMPTS.casual) + '\n';
    userPrompt += '- Generate 3 DIFFERENT caption variants. Each should take a different angle or hook.\n';
    userPrompt += '- Format the output as:\n\n';
    userPrompt += '## Variant 1\n[caption text]\n\n';
    userPrompt += '## Variant 2\n[caption text]\n\n';
    userPrompt += '## Variant 3\n[caption text]\n\n';
    userPrompt += '- Do NOT add any other headings or commentary.\n';

    const response = await env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 900,
      temperature: 0.85
    });

    const output = (response.response || '').trim();

    if (!output) {
      return json({ error: 'Model returned empty output. Please try again.' }, 500);
    }

    return json({ output: output });
  } catch (err) {
    console.error('Generate error:', err);
    return json({ error: 'Processing failed. Please try again in a moment.' }, 500);
  }
}

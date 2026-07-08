// Calls the Groq Chat Completions API (OpenAI-compatible) to turn a raw idea
// into platform-ready social posts, using the user's stored brand voice as
// context.
//
// Requires GROQ_API_KEY to be set in .env (see .env.example).
// Get a key at https://console.groq.com/keys

const PLATFORM_GUIDANCE = {
  instagram: 'Instagram caption: conversational, can use line breaks and up to ~5 relevant hashtags at the end.',
  tiktok: 'TikTok caption: short, punchy, hook in the first line, casual, 1-3 hashtags.',
  x: 'X (Twitter) post: under 280 characters, no more than 1-2 hashtags, direct and punchy.',
  linkedin: 'LinkedIn post: professional but still human, can be a few short paragraphs, minimal or no hashtags.',
  facebook: 'Facebook post: friendly, slightly longer form is fine, minimal hashtags.',
  youtube: 'YouTube Shorts caption: short, curiosity-driven, 1-3 hashtags.',
};

async function generatePosts({ idea, platforms, brandProfile }) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set. Add it to your .env file to enable AI generation.');
  }

  const brandContext = `
Brand tone/voice: ${brandProfile.tone || 'Not specified yet - use a friendly, clear default tone.'}
Target audience: ${brandProfile.audience || 'General audience.'}
Rules / likes / dislikes: ${brandProfile.rules || 'None specified.'}
Example posts that sound like this brand:
${brandProfile.sample_posts || '(none provided yet)'}
`.trim();

  const platformList = platforms
    .map((p) => `- ${p}: ${PLATFORM_GUIDANCE[p] || 'Standard social post.'}`)
    .join('\n');

  const systemPrompt = `You are a social media copywriter. You write posts that sound like a specific brand, never generic or robotic. Follow the brand voice notes closely. Return ONLY valid JSON, no markdown fences, no commentary, in this exact shape:
{"posts": [{"platform": "instagram", "content": "..."}, ...]}`;

  const userPrompt = `${brandContext}

Idea to turn into posts: "${idea}"

Generate one tailored post for each of these platforms:
${platformList}

Respond with only the JSON object described in the system prompt.`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.GROQ_API_KEY,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error('Groq API error (' + response.status + '): ' + errText);
  }

  const data = await response.json();
  const messageText = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!messageText) {
    throw new Error('No text returned from AI model');
  }

  const cleaned = messageText.replace(/```json|```/g, '').trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('Failed to parse AI response as JSON: ' + cleaned.slice(0, 200));
  }

  return parsed.posts || [];
}

module.exports = { generatePosts };

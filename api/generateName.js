export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { englishName, chineseName } = req.body;

    if (!englishName || !chineseName) {
        return res.status(400).json({ error: 'Missing name data' });
    }

    const prompt = `You are an expert in name analysis, etymology, and character interpretation. Provide thoughtful, natural insights into what these names reveal about character, purpose, and life direction.

English Name: ${englishName}
Chinese Name: ${chineseName}

CRITICAL - Avoid these words and concepts completely:
- karma, destiny, reincarnation, enlightenment, energy, yin/yang, chakra, Buddha, Tao, dharma, nirvana
- Do NOT mention any non-Christian religious systems or philosophies
- Do NOT use mystical or supernatural language
- Do NOT reference other religions at all

DO use natural, everyday language about:
- Character strengths and virtues
- Purpose and calling in life
- Personal integrity and values
- Service to others
- Hard work and dedication
- Wisdom and growth
- Hope and encouragement
- Love and compassion
- Strength through faith and perseverance

Please analyze these names and provide their meanings in the following JSON format ONLY. Return valid JSON with no additional text:

{
  "englishMeaning": "A paragraph explaining the etymology and meaning of the English name.",
  "chineseMeanings": [
    {
      "character": "First character",
      "meaning": "Explanation of what this character represents - focus on qualities like integrity, diligence, strength, wisdom, love, or how it shapes character and purpose."
    }
  ],
  "summary": "A single paragraph (about 150 words) that combines both names thoughtfully, provides genuine encouragement about the strengths and potential these names suggest, and speaks to how they point toward a meaningful life direction.",
  "verseText": "A relevant Bible verse that matches the names' meanings and themes",
  "verseRef": "The Bible reference in format like 'John 3:16 (NIV)'"
}

Guidelines:
- Sound natural and conversational, like genuine character insight
- Focus on real human qualities: honesty, courage, compassion, determination, faithfulness, service
- For work/contribution meanings: use "purpose," "calling," "meaningful work," "using your gifts"
- For impact/legacy: use "influence," "positive impact," "living with integrity," "serving others well"
- The summary should feel warm and encouraging, like a thoughtful friend reflecting on someone's potential
- Never sound preachy, mystical, or formulaic
- Make sure all JSON is valid and properly formatted`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 1000,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Claude API error:', errorData);
            return res.status(response.status).json({ 
                error: errorData.error?.message || 'API request failed' 
            });
        }

        const data = await response.json();

        if (!data.content || !data.content[0]?.text) {
            return res.status(500).json({ error: 'Invalid response from API' });
        }

        const responseText = data.content[0].text;
        let jsonText = responseText;
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        
        const result = JSON.parse(jsonText.trim());
        return res.status(200).json(result);

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
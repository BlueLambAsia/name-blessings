export default async function handler(req, res) {
    // Enable CORS
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

    const prompt = `You are an expert in name meanings, etymology, and Chinese character interpretation. A user has provided an English name and a Chinese name.

English Name: ${englishName}
Chinese Name: ${chineseName}

Please analyze these names and provide their meanings in the following JSON format ONLY. Return valid JSON with no additional text:

{
  "englishMeaning": "A paragraph explaining the etymology and meaning of the English name.",
  "chineseMeanings": [
    {
      "character": "First character",
      "meaning": "Explanation of what this character means"
    }
  ],
  "summary": "A single paragraph (about 150 words) that combines both names, provides encouragement with Christian content, and explains how they complement each other.",
  "verseText": "A relevant Bible verse that matches the names' meanings and themes",
  "verseRef": "The Bible reference in format like 'John 3:16 (NIV)'"
}

Important:
- The englishMeaning should be 2-3 sentences explaining the name's origin and significance
- The chineseMeanings array should have one object for each character in the Chinese name
- The summary must be encouraging with Christian themes, one continuous paragraph, and not start with "Dear"
- The verseText should be just the quote without quotation marks
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
                model: 'claude-3-5-haiku-20241022',
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
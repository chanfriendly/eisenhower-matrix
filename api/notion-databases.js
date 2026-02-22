import { Client } from '@notionhq/client';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Expecting the frontend to pass the user's token
    const { notionToken } = req.body;

    if (!notionToken) {
        return res.status(401).json({ error: 'Missing notionToken. Please login to Notion first.' });
    }

    // Initialize Notion client with the specific user's token
    const notion = new Client({ auth: notionToken });

    try {
        // Search Notion specifically for databases this bot has access to
        const response = await notion.search({
            filter: {
                value: 'database',
                property: 'object'
            }
        });

        // Map it down to a simple array for the frontend
        const databases = response.results.map(db => ({
            id: db.id,
            title: db.title?.[0]?.plain_text || 'Untitled Database'
        }));

        res.status(200).json({ databases });
    } catch (error) {
        console.error('Error fetching databases:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch databases' });
    }
}

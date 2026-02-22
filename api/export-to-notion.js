import { Client } from '@notionhq/client';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { title, notes, energy, quadrantId, status, subtasks, notionToken, databaseId } = req.body;

        if (!notionToken || !databaseId) {
            return res.status(400).json({ error: 'Missing notionToken or databaseId.' });
        }

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        // Initialize client with the dynamic user token
        const notion = new Client({ auth: notionToken });

        // 1. Construct Properties
        const properties = {
            "Name": {
                title: [
                    {
                        text: {
                            content: title,
                        },
                    },
                ],
            },
            "Source": {
                select: {
                    name: "Eisenhower Matrix"
                }
            }
        };

        // Add optional properties if they exist and align with typical Notion schemas
        if (quadrantId) {
            properties["Quadrant"] = {
                select: {
                    name: quadrantId
                }
            };
        }

        if (energy) {
            properties["Energy"] = {
                select: {
                    name: energy
                }
            };
        }

        if (status) {
            properties["Status"] = {
                select: {
                    name: status === 'completed' ? 'Done' : 'To-do'
                }
            }
        }

        // 2. Construct Body (Children blocks)
        const children = [];

        // Add notes as paragraphs
        if (notes) {
            // Split by newline to create separate paragraph blocks
            const paragraphs = notes.split('\n').filter(p => p.trim() !== '');
            for (const p of paragraphs) {
                // Notion has a 2000 character limit per text block, so we might need to chunk it.
                // For simplicity in this demo, we assume each paragraph is under 2000 chars.
                children.push({
                    object: 'block',
                    type: 'paragraph',
                    paragraph: {
                        rich_text: [
                            {
                                type: 'text',
                                text: {
                                    content: p.substring(0, 2000), // Safety truncation
                                },
                            },
                        ],
                    },
                });
            }
        }

        // Add a divider if we have both notes and subtasks
        if (notes && subtasks && subtasks.length > 0) {
            children.push({
                object: 'block',
                type: 'divider',
                divider: {}
            });
            children.push({
                object: 'block',
                type: 'heading_2',
                heading_2: {
                    rich_text: [{ type: 'text', text: { content: "Subtasks" } }]
                }
            });
        }

        // Add subtasks as to_do blocks
        if (subtasks && Array.isArray(subtasks)) {
            for (const st of subtasks) {
                children.push({
                    object: 'block',
                    type: 'to_do',
                    to_do: {
                        rich_text: [
                            {
                                type: 'text',
                                text: {
                                    content: st.title.substring(0, 2000), // Safety truncation
                                },
                            },
                        ],
                        checked: st.status === 'completed',
                    },
                });
            }
        }

        // 3. Make the API Call to Notion
        const response = await notion.pages.create({
            parent: { database_id: databaseId },
            properties: properties,
            children: children,
        });

        res.status(200).json({ success: true, url: response.url, id: response.id });
    } catch (error) {
        console.error('Error exporting to Notion:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}

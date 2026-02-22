export default function handler(req, res) {
    const clientId = process.env.NOTION_CLIENT_ID;

    if (!clientId) {
        return res.status(500).json({ error: 'NOTION_CLIENT_ID is not configured on the server.' });
    }

    // Determine domain (for local testing vs production)
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const domain = `${protocol}://${host}`;

    // Redirect URI must exactly match what is registered in Notion Integration settings
    const redirectUri = `${domain}/api/notion-callback`;

    // Notion Authorization URL
    // State is optional but good for CSRF protection. Left simple for now.
    const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?owner=user&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

    // Perform the redirect
    res.redirect(302, notionAuthUrl);
}

export default async function handler(req, res) {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send("No authorization code provided by Notion.");
    }

    const clientId = process.env.NOTION_CLIENT_ID;
    const clientSecret = process.env.NOTION_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return res.status(500).send("Notion Client ID or Secret not configured.");
    }

    // Determine domain for redirect URI
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const domain = `${protocol}://${host}`;
    const redirectUri = `${domain}/api/notion-callback`;

    // Standard OAuth 2.0 Token Exchange for Notion
    // Notion requires Basic Auth header with encoded client_id:client_secret
    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    try {
        const response = await fetch('https://api.notion.com/v1/oauth/token', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Basic ${encoded}`
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Notion Token Exchange Failed:", errorData);
            return res.status(response.status).send(`Failed to authenticate with Notion: ${errorData.error}`);
        }

        const data = await response.json();

        // The access_token we need to store on the client
        const accessToken = data.access_token;
        const workspaceName = data.workspace_name || 'Notion';

        // Redirect back to the frontend, passing the token via URL hash fragment
        // Hash fragments (#) are not sent to the server, keeping them slightly more secure from server logs
        res.redirect(302, `/#notion_token=${accessToken}&workspace=${encodeURIComponent(workspaceName)}`);
    } catch (error) {
        console.error("Error exchanging code:", error);
        res.status(500).send("Internal Server Error exchanging code.");
    }
}

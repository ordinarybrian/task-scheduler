const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const url = require('url');

const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
const TOKEN_PATH       = path.join(__dirname, '..', 'token.json');
const SCOPES           = ['https://www.googleapis.com/auth/calendar'];
const REDIRECT_URI     = 'http://localhost:3001/oauth2callback';

/**
 * Returns an authenticated Google OAuth2 client.
 * On first run, opens a browser-based OAuth flow and saves the token.
 * On subsequent runs, loads the saved token and refreshes if needed.
 */
async function getAuthClient() {
  let credentials;
  try {
    const raw = await fs.readFile(CREDENTIALS_PATH, 'utf8');
    credentials = JSON.parse(raw);
  } catch {
    throw new Error(
      'credentials.json not found in task-scheduler/scripts/.\n' +
      'Download it from Google Cloud Console (APIs & Services > Credentials) and rename it credentials.json.\n' +
      'See credentials.json.example for the expected structure.'
    );
  }

  const { client_id, client_secret } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URI);

  try {
    const raw = await fs.readFile(TOKEN_PATH, 'utf8');
    oAuth2Client.setCredentials(JSON.parse(raw));

    // Refresh the token if it is expired or about to expire
    const expiry = oAuth2Client.credentials.expiry_date;
    if (expiry && expiry < Date.now() + 60_000) {
      const { credentials: refreshed } = await oAuth2Client.refreshAccessToken();
      oAuth2Client.setCredentials(refreshed);
      await fs.writeFile(TOKEN_PATH, JSON.stringify(refreshed, null, 2));
    }

    return oAuth2Client;
  } catch {
    return runOAuthFlow(oAuth2Client);
  }
}

async function runOAuthFlow(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  console.log('\nGoogle Calendar authorization required.');
  console.log('Open this URL in your browser:\n');
  console.log(authUrl);
  console.log('\nWaiting for authorization...\n');

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const { code } = url.parse(req.url, true).query;
        if (!code) return;

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<p>Authorization successful. You can close this tab.</p>');
        server.close();

        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        console.log('Token saved. You will not need to re-authorize unless the token is revoked.\n');
        resolve(oAuth2Client);
      } catch (err) {
        reject(err);
      }
    });

    server.listen(3001, () => {});
    server.on('error', reject);
  });
}

module.exports = { getAuthClient };

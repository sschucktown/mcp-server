const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// ⬇️ Paste the code you get from the browser redirect
const code = 'PASTE_THE_AUTH_CODE_HERE';

oauth2Client.getToken(code).then(({ tokens }) => {
  console.log('✅ Tokens:', tokens);
}).catch(err => {
  console.error('❌ Error getting token:', err);
});

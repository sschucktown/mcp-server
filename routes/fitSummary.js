const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const fitness = google.fitness({ version: 'v1', auth: oauth2Client });

router.get('/', async (req, res) => {
  try {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const startTime = now - oneDayMs * 2; // 2 days ago
    const endTime = now;

    const response = await fitness.users.sessions.list({
      userId: 'me',
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
    });

    const sleepSessions = response.data.session?.filter(s => s.activityType === 72); // Sleep

    res.json({ sleepSessions });
  } catch (error) {
    console.error("❌ Error fetching sleep data:", error.message);
    res.status(500).json({ error: "Failed to fetch sleep data" });
  }
});

module.exports = router;

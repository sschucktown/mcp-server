// routes/freeBlocks.js
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

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

router.get('/', async (req, res) => {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(18, 0, 0, 0); // 6 PM

  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: endOfDay.toISOString(),
        timeZone: 'America/New_York',
        items: [{ id: 'primary' }],
      }
    });

    const busy = response.data.calendars.primary.busy;
    const freeWindows = [];
    let lastEnd = new Date(now);
    lastEnd.setHours(6, 0, 0, 0); // Start at 6 AM

    for (const block of busy) {
      const busyStart = new Date(block.start);
      if (busyStart > lastEnd) {
        const gap = (busyStart - lastEnd) / (1000 * 60);
        if (gap >= 90) {
          freeWindows.push({
            start: lastEnd.toISOString(),
            end: busyStart.toISOString(),
          });
        }
      }
      lastEnd = new Date(block.end);
    }

    const dayEnd = new Date(now);
    dayEnd.setHours(18, 0, 0, 0);
    if (lastEnd < dayEnd) {
      const gap = (dayEnd - lastEnd) / (1000 * 60);
      if (gap >= 90) {
        freeWindows.push({
          start: lastEnd.toISOString(),
          end: dayEnd.toISOString(),
        });
      }
    }

    res.json({ freeWindows });
  } catch (error) {
    console.error("Error getting free blocks:", error);
    res.status(500).json({ error: "Failed to retrieve free calendar blocks" });
  }
});

module.exports = router;

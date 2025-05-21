// routes/checkAndSuggest.js
const express = require('express');
const axios = require('axios');
const { google } = require('googleapis');
const router = express.Router();

const WORLD_TIDES_API_KEY = process.env.WORLDTIDES_API_KEY;
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

const LAT = 32.7765; // Charleston
const LON = -79.9311;

router.post('/', async (req, res) => {
  const { day } = req.body;

  try {
    const now = new Date();
    const daysAhead = {
      'saturday': 6 - now.getDay(),
      'sunday': 7 - now.getDay(),
      'friday': 5 - now.getDay(),
      'monday': 8 - now.getDay()
    }[day.toLowerCase()] || 1;

    const target = new Date(now);
    target.setDate(now.getDate() + daysAhead);
    const dateStr = target.toISOString().split('T')[0];

    // Step 1: Get low tide
    const tideUrl = `https://www.worldtides.info/api/v2?extremes&date=${dateStr}&lat=${LAT}&lon=${LON}&key=${WORLD_TIDES_API_KEY}`;
    const tideRes = await axios.get(tideUrl);
    const lowTideData = tideRes.data.extremes.find(t => t.type === "Low");

    if (!lowTideData) {
      return res.status(400).json({ error: 'No low tide found for that day' });
    }

    const lowTide = new Date(lowTideData.date);
    const start = new Date(lowTide.getTime() + 60 * 60000); // 1 hour after
    const end = new Date(start.getTime() + 90 * 60000); // 1.5 hours window

    // Step 2: Get calendar availability
    const dayStart = new Date(target);
    dayStart.setHours(6, 0, 0, 0);
    const dayEnd = new Date(target);
    dayEnd.setHours(18, 0, 0, 0);

    const calendarRes = await calendar.freebusy.query({
      requestBody: {
        timeMin: dayStart.toISOString(),
        timeMax: dayEnd.toISOString(),
        timeZone: 'America/New_York',
        items: [
          { id: 'primary' },
          // Add more calendar IDs here if needed
        ],
      }
    });

    const busy = calendarRes.data.calendars.primary.busy;
    let isFree = true;

    for (const block of busy) {
      const busyStart = new Date(block.start);
      const busyEnd = new Date(block.end);

      if (
        (start >= busyStart && start < busyEnd) ||
        (end > busyStart && end <= busyEnd) ||
        (start <= busyStart && end >= busyEnd)
      ) {
        isFree = false;
        break;
      }
    }

    if (isFree) {
      return res.json({
        status: "recommended",
        start: start.toISOString(),
        end: end.toISOString(),
        message: "You're free during the ideal kayaking window. Want me to book it?"
      });
    } else {
      return res.json({
        status: "not recommended",
        message: "The ideal kayaking time conflicts with your calendar."
      });
    }
  } catch (error) {
    console.error("Error checking and suggesting kayaking window:", error);
    res.status(500).json({ error: "Internal error in kayak suggestion" });
  }
});

module.exports = router;

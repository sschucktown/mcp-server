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
  now.setSeconds(0);
  now.setMilliseconds(0);
  
  const endOfDay = new Date(now);
  endOfDay.setHours(18, 0, 0, 0); // 6 PM

  if (now >= endOfDay) {
  return res.status(200).json({ freeWindows: [] });
}

  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: endOfDay.toISOString(),
        timeZone: 'America/New_York',
        items: [
          { id: 'primary' },
          { id: '809ac72bd06f3c01e6ff651c96fb6407789940b2866e2d4fe0030322475c1ca6@group.calendar.google.com' },
          { id: 'bfe9a44806caa9eea74194bdc333ec2037c052a4c3756878105bff1ba33e7600@group.calendar.google.com' },
          { id: 'a2fc97945b860bed3b137558e401e0e8215e59fdf4437d0432ca189c73ce8699@group.calendar.google.com' },
          { id: 'e772e70ec349587e78ecc01f211c2bf9979c1a28715e0e37f41048eed9113af7@group.calendar.google.com' },
          { id: 'bb8d47ee51a63337fd38e8915b2747e4677affaf953245e65cc2fbc5d00922f1@group.calendar.google.com' },
          { id: '9aac5e2ff502178fc7dce0d199636261086038a0079e15dfbe1a196e473ea2fa@group.calendar.google.com' }
        ],
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

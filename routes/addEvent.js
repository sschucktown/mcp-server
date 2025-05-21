const express = require('express');
const { google } = require('googleapis');
const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Set the token manually here (from your own auth flow)
oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

router.post('/', async (req, res) => {
    const { summary, start, end } = req.body;

    try {
        const event = {
            summary,
            start: { dateTime: start, timeZone: 'America/New_York' },
            end: { dateTime: end, timeZone: 'America/New_York' },
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });

        res.json({
            status: 'success',
            link: response.data.htmlLink
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add calendar event' });
    }
});

module.exports = router;

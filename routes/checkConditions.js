const express = require('express');
const axios = require('axios');
const router = express.Router();

const WORLD_TIDES_API_KEY = process.env.WORLDTIDES_API_KEY;
const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// Charleston coordinates
const LAT = 32.7765;
const LON = -79.9311;

router.post('/', async (req, res) => {
    const { day } = req.body;

    try {
        // Get tomorrow's date based on "day" input
        const now = new Date();
        const target = new Date(now);
        const daysAhead = {
            'saturday': 6 - now.getDay(),
            'sunday': 7 - now.getDay()
        }[day.toLowerCase()] || 1;

        target.setDate(now.getDate() + daysAhead);
        const dateStr = target.toISOString().split('T')[0];

        // 1. Get tide info
        const tideRes = await axios.get(`https://www.worldtides.info/api/v2?extremes&date=${dateStr}&lat=${LAT}&lon=${LON}&key=${WORLD_TIDES_API_KEY}`);
        const tides = tideRes.data.extremes.filter(t => t.type === "Low");

        if (!tides.length) return res.status(400).json({ error: 'No low tide data found' });

        const lowTide = new Date(tides[0].date);
        const start = new Date(lowTide.getTime() + 90 * 60000); // 1.5 hr after low tide
        const end = new Date(start.getTime() + 2 * 60 * 60000); // 2 hr session

        // 2. Get weather
        const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${WEATHER_API_KEY}&units=imperial`);
        const forecasts = weatherRes.data.list;

        const rainForecast = forecasts.find(f => {
            const fTime = new Date(f.dt * 1000);
            return fTime >= start && fTime <= end;
        });

        const rainChance = rainForecast?.pop ? rainForecast.pop * 100 : 0;

        // 3. Return decision
        res.json({
            summary: rainChance < 30 ? "Conditions look great!" : "Rain chance may be too high.",
            lowTide: lowTide.toISOString(),
            suggestedWindow: {
                start: start.toISOString(),
                end: end.toISOString()
            },
            rainChance: `${Math.round(rainChance)}%`
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error checking kayak conditions' });
    }
});

module.exports = router;

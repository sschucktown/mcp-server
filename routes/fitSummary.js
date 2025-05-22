router.get('/', async (req, res) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const fitness = google.fitness({ version: 'v1', auth: oauth2Client });

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    console.log("📡 Fetching sleep data...");
    const response = await fitness.users.dataset.aggregate({
      userId: 'me',
      requestBody: {
        aggregateBy: [{
          dataTypeName: 'com.google.sleep.segment'
        }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: oneDayAgo,
        endTimeMillis: now
      }
    });

    console.log("✅ Sleep data:", JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (err) {
    console.error("❌ Error fetching sleep data:", err.message, err.response?.data || err);
    res.status(500).json({ error: "Failed to fetch sleep data" });
  }
});

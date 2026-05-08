export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  searchParams.set('apiKey', process.env.VITE_NEWS_API_KEY || '8daff9232c69400a835243d301f540de');
  
  // Clean up vercel specific query
  searchParams.delete('vercel-sc-query');

  const path = searchParams.get('endpoint') || 'top-headlines';
  searchParams.delete('endpoint');

  const url = `https://newsapi.org/v2/${path}?${searchParams.toString()}`;

  try {
    // Explicitly do not pass browser Origin header to avoid NewsAPI free tier block
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'FOAI-Dashboard-App',
      }
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

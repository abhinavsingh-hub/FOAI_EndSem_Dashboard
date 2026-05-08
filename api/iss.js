export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const endpoint = searchParams.get('endpoint') || 'iss-now.json';

  let url = `http://api.open-notify.org/${endpoint}`;

  try {
    let response = await fetch(url);
    
    // If open-notify blocks the Vercel IP (500/403/timeout), failover to a reliable HTTPS alternative
    if (!response.ok && endpoint === 'iss-now.json') {
      const fallbackResponse = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
      const fallbackData = await fallbackResponse.json();
      return res.status(200).json({
        message: 'success',
        iss_position: {
          latitude: fallbackData.latitude.toString(),
          longitude: fallbackData.longitude.toString()
        }
      });
    }

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

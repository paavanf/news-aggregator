export default async function handler(req, res) {
  try {
    const category = req.query.category || "general";
    const apiKey = process.env.NEWS_API_KEY;

    const response = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&category=${category}&apiKey=${apiKey}`
    );

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export default async function handler(req, res) {
  const API_KEY = process.env.NEWS_API_KEY;
  const { category = "general", query = "", page = 1 } = req.query;

  let base = "";
  const params = new URLSearchParams({
    apiKey: API_KEY,
    language: "en",
    pageSize: 20,
    page,
  });

  if (query) {
    base = "https://newsapi.org/v2/everything";
    params.set("q", query);
    params.set("sortBy", "relevancy");
  } else {
    base = "https://newsapi.org/v2/top-headlines";
    params.set("category", category);
    params.set("country", "us");
  }

  try {
    const r = await fetch(`${base}?${params.toString()}`);
    const data = await r.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
}

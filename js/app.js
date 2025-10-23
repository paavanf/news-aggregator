const API_KEY = "101f4dd9f31144a99e94abd180c3296f";

const el = {
  grid: document.getElementById("articlesGrid"),
  status: document.getElementById("status"),
  searchInput: document.getElementById("searchInput"),
  searchBtn: document.getElementById("searchBtn"),
  loadMoreBtn: document.getElementById("loadMoreBtn"),
  favoritesToggle: document.getElementById("favoritesToggle"),
  categories: document.getElementById("categories"),
};

const state = {
  page: 1,
  pageSize: 12,
  query: "",
  category: "",
  showFavorites: false,
  favorites: JSON.parse(localStorage.getItem("favorites") || "[]"),
  articles: [],
};

function setStatus(msg) {
  el.status.textContent = msg;
}

function saveFavorites() {
  localStorage.setItem("favorites", JSON.stringify(state.favorites));
}

function toggleFavorite(article) {
  const idx = state.favorites.findIndex(a => a.url === article.url);
  if (idx >= 0) state.favorites.splice(idx, 1);
  else state.favorites.push(article);
  saveFavorites();
  renderArticles(state.showFavorites ? state.favorites : state.articles);
}

function isFavorite(url) {
  return state.favorites.some(a => a.url === url);
}

async function fetchArticles(replace = false) {
  if (state.showFavorites) {
    renderArticles(state.favorites);
    setStatus(`Showing ${state.favorites.length} saved articles.`);
    return;
  }

  setStatus("Loading...");
  el.loadMoreBtn.disabled = true;

  try {
    let base = '';
    const params = new URLSearchParams({
      apiKey: API_KEY,
      page: state.page,
      pageSize: state.pageSize,
      language: "en",
    });

    if (state.query) {
      base = "https://newsapi.org/v2/everything";
      params.set("q", state.query);
      params.set("sortBy", "relevancy");
      params.set("searchIn", "title,description");
    } else if (state.category) {
      base = "https://newsapi.org/v2/top-headlines";
      params.set("category", state.category);
      params.set("country", "us");
    } else {
      base = "https://newsapi.org/v2/top-headlines";
      params.set("country", "us");
      params.set("pageSize", 20);
    }

    const url = `${base}?${params.toString()}`;
    const res = await fetch(`/api/news?category=${state.category}&query=${state.query}&page=${state.page}`);
    const json = await res.json();

    if (json.status !== "ok") {
      setStatus("Error: " + (json.message || "Unknown"));
      return;
    }

    let newArticles = (json.articles || []).filter(a => a.title && a.url);

    if (state.query) {
      const keywords = state.query.toLowerCase().split(/\s+/);
      newArticles = newArticles.filter(a => {
        const searchText = `${a.title} ${a.description || ""}`.toLowerCase();
        return keywords.some(keyword => searchText.includes(keyword));
      });
    }

    if (newArticles.length === 0) {
      setStatus("No articles found. Try another keyword or category.");
      el.grid.innerHTML = "";
      return;
    }

    newArticles.sort((a, b) => {
      const aHas = a.urlToImage ? 1 : 0;
      const bHas = b.urlToImage ? 1 : 0;
      if (bHas !== aHas) return bHas - aHas;
      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });

    newArticles = newArticles.slice(0, state.pageSize);

    state.articles = replace ? newArticles : state.articles.concat(newArticles);
    renderArticles(state.articles);

    let mode = state.query ? "search results" : state.category ? state.category : "trending";
    setStatus(`Showing ${state.articles.length} ${mode} articles (page ${state.page}).`);

    if (replace) window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error(err);
    setStatus("Network error while loading articles.");
  } finally {
    el.loadMoreBtn.disabled = false;
  }
}

function renderArticles(articles) {
  el.grid.innerHTML = "";
  for (const a of articles) {
    const card = document.createElement("article");
    card.className =
      "bg-white shadow rounded-lg overflow-hidden flex flex-col hover:shadow-md transition";

    card.innerHTML = `
      ${
        a.urlToImage
          ? `<img src="${a.urlToImage}" alt="" class="w-full h-48 object-cover">`
          : `<div class="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500">No image</div>`
      }
      <div class="p-4 flex flex-col flex-1">
        <h2 class="font-semibold text-lg mb-2">${a.title}</h2>
        <p class="text-sm flex-1">${a.description || ""}</p>
        <div class="mt-4 flex items-center justify-between text-sm">
          <span class="text-gray-500">${a.source?.name || "Unknown"}</span>
          <div class="flex gap-2">
            <button class="text-blue-600 hover:underline" onclick="window.open('${a.url}', '_blank')">Read</button>
            <button class="text-yellow-600 hover:underline" data-url="${a.url}">${
      isFavorite(a.url) ? "★" : "☆"
    }</button>
          </div>
        </div>
      </div>
    `;
    el.grid.appendChild(card);

    const favBtn = card.querySelector("[data-url]");
    favBtn.addEventListener("click", () => toggleFavorite(a));
  }
}

el.searchBtn.addEventListener("click", () => {
  state.query = el.searchInput.value.trim();
  if (!state.query) {
    setStatus("Please enter a search term");
    return;
  }
  state.category = "";
  state.page = 1;
  fetchArticles(true);
});

el.searchInput.addEventListener("keydown", e => {
  if (e.key === "Enter") el.searchBtn.click();
});

el.loadMoreBtn.addEventListener("click", () => {
  state.page++;
  fetchArticles();
});

el.favoritesToggle.addEventListener("click", () => {
  state.showFavorites = !state.showFavorites;
  el.favoritesToggle.textContent = state.showFavorites
    ? "Show all news"
    : "Show favorites";
  fetchArticles(true);
});

const categories = [
  "business",
  "entertainment",
  "general",
  "health",
  "science",
  "sports",
  "technology",
];
categories.forEach(cat => {
  const btn = document.createElement("button");
  btn.textContent = cat;
  btn.className =
    "px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 capitalize";
  btn.addEventListener("click", () => {
    state.category = cat;
    state.query = "";
    state.page = 1;
    fetchArticles(true);
  });
  el.categories.appendChild(btn);
});

fetchArticles(true);
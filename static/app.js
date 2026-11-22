const translations = {
  uz: {
    latest: "So‘nggi yangiliklar",
    popular: "Ommabop",
    topics: "Mavzular",
    all: "Barchasi",
    world: "Jahon",
    technology: "Texnologiya",
    business: "Biznes",
    sports: "Sport",
    science: "Ilm-fan",
    follow: "Dunyodan xabardor bo‘ling.",
    followSub: "Muhim voqealar — bitta manzilda.",
    search: "Yangilik qidirish…",
    loading: "Yangiliklar yuklanmoqda…",
    empty: "Hozircha yangilik topilmadi.",
    error: "Yangiliklarni yuklashda xatolik yuz berdi.",
    read: "Asl manba ↗",
    expand: "To‘liq o‘qish ↓",
    collapse: "Yig‘ish ↑",
    featured: "⚡ Asosiy yangilik",
    noImage: "📰"
  },
  ru: {
    latest: "Последние новости",
    popular: "Популярное",
    topics: "Темы",
    all: "Все",
    world: "Мир",
    technology: "Технологии",
    business: "Бизнес",
    sports: "Спорт",
    science: "Наука",
    follow: "Будьте в курсе событий.",
    followSub: "Важные события — в одном месте.",
    search: "Поиск новостей…",
    loading: "Загрузка новостей…",
    empty: "Новостей пока нет.",
    error: "Ошибка загрузки новостей.",
    read: "Первоисточник ↗",
    expand: "Читать полностью ↓",
    collapse: "Свернуть ↑",
    featured: "⚡ Главная новость",
    noImage: "📰"
  },
  en: {
    latest: "Latest news",
    popular: "Popular",
    topics: "Topics",
    all: "All",
    world: "World",
    technology: "Technology",
    business: "Business",
    sports: "Sports",
    science: "Science",
    follow: "Stay informed.",
    followSub: "Important events — all in one place.",
    search: "Search news…",
    loading: "Loading news…",
    empty: "No news found.",
    error: "There was an error loading news.",
    read: "Original source ↗",
    expand: "Read more ↓",
    collapse: "Show less ↑",
    featured: "⚡ Featured story",
    noImage: "📰"
  }
};

let lang = "uz";
let category = "all";
let searchTimer = null;

const $ = selector => document.querySelector(selector);

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol)
      ? url.href
      : "";
  } catch {
    return "";
  }
}

function setLanguage(value) {
  lang = translations[value] ? value : "uz";
  document.documentElement.lang = lang;

  document.querySelectorAll("[data-i]").forEach(element => {
    const key = element.dataset.i;
    if (translations[lang][key]) {
      element.textContent = translations[lang][key];
    }
  });

  const search = $("#search");
  if (search) search.placeholder = translations[lang].search;

  loadNews();
}

function formatCategory(value) {
  const key = String(value || "world").toLowerCase();
  return translations[lang][key] || value || translations[lang].world;
}

function makeImage(url, alt, className) {
  const box = document.createElement("div");
  box.className = className;

  const imageUrl = safeUrl(url);

  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = alt || "WorldPulse news";
    img.loading = "lazy";

    img.onerror = () => {
      img.remove();
      box.textContent = translations[lang].noImage;
    };

    box.appendChild(img);
  } else {
    box.textContent = translations[lang].noImage;
  }

  return box;
}

function makeReadMore(summary) {
  const wrapper = document.createElement("div");
  wrapper.className = "summary-wrap";

  const text = document.createElement("p");
  text.className = "news-summary";
  text.textContent = summary || "";

  wrapper.appendChild(text);

  if ((summary || "").length > 130) {
    const button = document.createElement("button");
    button.className = "expand-button";
    button.type = "button";
    button.textContent = translations[lang].expand;

    button.addEventListener("click", () => {
      const expanded = wrapper.classList.toggle("expanded");
      button.textContent = expanded
        ? translations[lang].collapse
        : translations[lang].expand;
    });

    wrapper.appendChild(button);
  }

  return wrapper;
}

function makeSourceLink(article) {
  const url = safeUrl(article.url);
  if (!url) return null;

  const link = document.createElement("a");
  link.className = "source-link";
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = translations[lang].read;

  return link;
}

function createNewsCard(article) {
  const card = document.createElement("article");
  card.className = "news-card";

  const image = makeImage(
    article.image_url,
    article.title,
    "card-art"
  );

  const body = document.createElement("div");
  body.className = "card-body";

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = formatCategory(article.category);

  const title = document.createElement("h3");
  title.textContent = article.title || "";

  const summary = makeReadMore(article.summary || "");

  const footer = document.createElement("div");
  footer.className = "card-footer";

  const source = document.createElement("span");
  source.className = "news-source";
  source.textContent = article.source || "WorldPulse";

  footer.appendChild(source);

  const link = makeSourceLink(article);
  if (link) footer.appendChild(link);

  body.append(tag, title, summary, footer);
  card.append(image, body);

  return card;
}

function createHero(article) {
  const container = $("#hero-main");
  if (!container) return;

  container.replaceChildren();

  const image = makeImage(
    article.image_url,
    article.title,
    "hero-image"
  );

  const overlay = document.createElement("div");
  overlay.className = "hero-content";

  const badge = document.createElement("span");
  badge.className = "hero-badge";
  badge.textContent = translations[lang].featured;

  const title = document.createElement("h1");
  title.textContent = article.title || "";

  const summary = document.createElement("p");
  summary.className = "hero-summary";
  summary.textContent = article.summary || "";

  const meta = document.createElement("div");
  meta.className = "hero-meta";

  const tag = document.createElement("span");
  tag.textContent = formatCategory(article.category);

  const source = document.createElement("span");
  source.textContent = article.source || "WorldPulse";

  meta.append(tag, source);

  const link = makeSourceLink(article);
  if (link) meta.appendChild(link);

  overlay.append(badge, title, summary, meta);
  container.append(image, overlay);
}

function createSideNews(article) {
  const card = document.createElement("article");
  card.className = "side-news";

  const image = makeImage(
    article.image_url,
    article.title,
    "side-image"
  );

  const body = document.createElement("div");
  body.className = "side-body";

  const categoryTag = document.createElement("span");
  categoryTag.className = "side-category";
  categoryTag.textContent = formatCategory(article.category);

  const title = document.createElement("h3");
  title.textContent = article.title || "";

  const source = document.createElement("small");
  source.textContent = article.source || "WorldPulse";

  const link = makeSourceLink(article);

  body.append(categoryTag, title, source);
  if (link) body.appendChild(link);

  card.append(image, body);
  return card;
}

function renderFeatured(articles) {
  const main = $("#hero-main");
  const side = $("#hero-side");

  if (!main || !side) return;

  main.replaceChildren();
  side.replaceChildren();

  if (!articles.length) {
    main.textContent = translations[lang].empty;
    return;
  }

  createHero(articles[0]);

  articles.slice(1, 4).forEach(article => {
    side.appendChild(createSideNews(article));
  });
}

async function loadNews() {
  const container = $("#news");
  if (!container) return;

  container.textContent = translations[lang].loading;

  try {
    const params = new URLSearchParams({
      category,
      q: $("#search")?.value || ""
    });

    const response = await fetch("/api/articles?" + params);

    if (!response.ok) {
      throw new Error("API error: " + response.status);
    }

    const articles = await response.json();

    if (!Array.isArray(articles)) {
      throw new Error("Invalid news data");
    }

    renderFeatured(articles);

    container.replaceChildren();

    // Asosiy va yon yangiliklardan keyingilarini chiqaramiz.
    const latestArticles = articles.slice(4);

    if (!latestArticles.length) {
      container.textContent = articles.length
        ? ""
        : translations[lang].empty;
      return;
    }

    latestArticles.forEach(article => {
      container.appendChild(createNewsCard(article));
    });

  } catch (error) {
    console.error("WorldPulse:", error);

    container.textContent = translations[lang].error;

    const main = $("#hero-main");
    if (main) {
      main.textContent = translations[lang].error;
    }
  }
}

async function checkStatus() {
  const statusElement = $("#status");
  if (!statusElement) return;

  try {
    const response = await fetch("/api/status");
    if (!response.ok) throw new Error("Status error");

    const data = await response.json();

    statusElement.textContent =
      "WorldPulse: " + data.status +
      " · " + data.articles + " news";

  } catch {
    statusElement.textContent =
      "WorldPulse server status unavailable.";
  }
}

$("#lang")?.addEventListener("change", event => {
  setLanguage(event.target.value);
});

$("#filters")?.addEventListener("click", event => {
  const button = event.target.closest("button[data-cat]");
  if (!button) return;

  category = button.dataset.cat;

  document.querySelectorAll("#filters button").forEach(item => {
    item.classList.toggle("active", item === button);
  });

  loadNews();
});

$("#search")?.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadNews, 350);
});

setLanguage("uz");
checkStatus();

setInterval(checkStatus, 60000);

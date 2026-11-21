const translations = {
  uz: {
    latest: "So‘nggi yangiliklar",
    popular: "Ommabop",
    topics: "Mavzular",
    eyebrow: "DUNYO YANGILIKLARI · BIR JOYDA",
    headline: "Dunyo ritmini birinchi bo‘lib his eting.",
    sub: "Jahon, texnologiya, biznes, sport va ilm-fandagi muhim voqealar.",
    explore: "Yangiliklarni ko‘rish ↓",
    ad: "Reklama joyi — reklama tarmog‘i ulangach faollashadi",
    all: "Barchasi",
    world: "Jahon",
    technology: "Texnologiya",
    business: "Biznes",
    sports: "Sport",
    science: "Ilm-fan",
    follow: "Dunyodan xabardor bo‘ling.",
    followSub: "Muhim voqealar — bitta manzilda.",
    tagline: "The World. One Pulse.",
    disclaimer: "Maqolalar manbasi har bir xabarda ko‘rsatiladi.",
    search: "Yangilik qidirish…",
    loading: "Yangiliklar yuklanmoqda…",
    empty: "Hozircha yangilik topilmadi.",
    error: "Yangiliklarni yuklashda xatolik yuz berdi.",
    read: "Asl manba ↗"
  },
  ru: {
    latest: "Последние новости",
    popular: "Популярное",
    topics: "Темы",
    eyebrow: "МИРОВЫЕ НОВОСТИ · В ОДНОМ МЕСТЕ",
    headline: "Почувствуйте ритм мира первыми.",
    sub: "Главные события мира, технологий, бизнеса, спорта и науки.",
    explore: "Смотреть новости ↓",
    ad: "Место для рекламы — активируется после подключения рекламной сети",
    all: "Все",
    world: "Мир",
    technology: "Технологии",
    business: "Бизнес",
    sports: "Спорт",
    science: "Наука",
    follow: "Будьте в курсе событий.",
    followSub: "Важные события — в одном месте.",
    tagline: "The World. One Pulse.",
    disclaimer: "Источник каждой статьи указан в публикации.",
    search: "Поиск новостей…",
    loading: "Загрузка новостей…",
    empty: "Новостей пока нет.",
    error: "Ошибка загрузки новостей.",
    read: "Первоисточник ↗"
  },
  en: {
    latest: "Latest news",
    popular: "Popular",
    topics: "Topics",
    eyebrow: "WORLD NEWS · ONE PLACE",
    headline: "Feel the pulse of the world first.",
    sub: "Important stories from world affairs, technology, business, sports and science.",
    explore: "Explore news ↓",
    ad: "Advertisement space — activates when an ad network is connected",
    all: "All",
    world: "World",
    technology: "Technology",
    business: "Business",
    sports: "Sports",
    science: "Science",
    follow: "Stay informed.",
    followSub: "Important events — all in one place.",
    tagline: "The World. One Pulse.",
    disclaimer: "The source of each article is displayed.",
    search: "Search news…",
    loading: "Loading news…",
    empty: "No news found.",
    error: "There was an error loading news.",
    read: "Original source ↗"
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

  $("#search").placeholder = translations[lang].search;
  loadNews();
}

function formatCategory(value) {
  const key = String(value || "world").toLowerCase();
  return translations[lang][key] || key.toUpperCase();
}

function createNewsCard(article) {
  const card = document.createElement("article");
  card.className = "news-card";

  const imageBox = document.createElement("div");
  imageBox.className = "card-art";

  const imageUrl = safeUrl(article.image_url);

  if (imageUrl) {
    const img = document.createElement("img");
    img.src = imageUrl;
    img.alt = article.title || "WorldPulse news";
    img.loading = "lazy";

    img.onerror = () => {
      img.remove();
      imageBox.textContent = "📰";
    };

    imageBox.appendChild(img);
  } else {
    imageBox.textContent = "📰";
  }

  const body = document.createElement("div");
  body.className = "card-body";

  const tag = document.createElement("span");
  tag.className = "tag";
  tag.textContent = formatCategory(article.category);

  const title = document.createElement("h3");
  title.textContent = article.title || "";

  const summary = document.createElement("p");
  summary.textContent = article.summary || "";

  const footer = document.createElement("small");
  footer.textContent = article.source || "WorldPulse";

  const url = safeUrl(article.url);

  if (url) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = " · " + translations[lang].read;
    footer.appendChild(link);
  }

  body.append(tag, title, summary, footer);
  card.append(imageBox, body);

  return card;
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
    container.replaceChildren();

    if (!articles.length) {
      container.textContent = translations[lang].empty;
      return;
    }

    articles.forEach(article => {
      container.appendChild(createNewsCard(article));
    });
  } catch (error) {
    console.error("WorldPulse:", error);
    container.textContent = translations[lang].error;
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
    statusElement.textContent = "WorldPulse server status unavailable.";
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

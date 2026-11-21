from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from html.parser import HTMLParser
from html import unescape
from urllib.parse import urlparse
import sqlite3
import feedparser
import hashlib
import os
import re

from apscheduler.schedulers.background import BackgroundScheduler
from .feeds import RSS_FEEDS

BASE = Path(__file__).resolve().parent.parent
DB = BASE / "worldpulse.db"

ENABLE_RSS_BOT = os.getenv("ENABLE_RSS_BOT", "false").lower() == "true"

app = FastAPI(title="WorldPulse API", version="0.2.0")
scheduler = BackgroundScheduler()


class ImageFinder(HTMLParser):
    def __init__(self):
        super().__init__()
        self.image = ""

    def handle_starttag(self, tag, attrs):
        if tag.lower() == "img" and not self.image:
            attrs = dict(attrs)
            self.image = attrs.get("src", "")


def valid_image_url(url):
    if not url:
        return ""
    url = str(url).strip()
    parsed = urlparse(url)
    if parsed.scheme in ("http", "https") and parsed.netloc:
        return url
    return ""


def find_image(entry):
    for item in entry.get("media_content", []):
        image = valid_image_url(item.get("url", ""))
        if image:
            return image

    for item in entry.get("media_thumbnail", []):
        image = valid_image_url(item.get("url", ""))
        if image:
            return image

    for item in entry.get("enclosures", []):
        if "image" in item.get("type", ""):
            image = valid_image_url(item.get("href", ""))
            if image:
                return image

    finder = ImageFinder()
    content = entry.get("summary", "") or ""

    for block in entry.get("content", []):
        content += " " + block.get("value", "")

    try:
        finder.feed(content)
    except Exception:
        pass

    return valid_image_url(finder.image)


def clean_text(value, limit=420):
    value = re.sub(r"<[^>]+>", " ", str(value or ""))
    value = unescape(value)
    return " ".join(value.split())[:limit]


def db():
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    return con


def init_db():
    with db() as con:
        con.execute("""
            CREATE TABLE IF NOT EXISTS articles (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                summary TEXT,
                source TEXT,
                url TEXT UNIQUE,
                category TEXT,
                published TEXT,
                language TEXT DEFAULT 'en',
                image_url TEXT
            )
        """)

        columns = [
            row["name"]
            for row in con.execute("PRAGMA table_info(articles)").fetchall()
        ]

        if "image_url" not in columns:
            con.execute("ALTER TABLE articles ADD COLUMN image_url TEXT")


def fetch_feeds():
    init_db()
    added = 0

    for feed_info in RSS_FEEDS:
        try:
            parsed = feedparser.parse(feed_info["url"])

            for entry in parsed.entries[:20]:
                url = str(entry.get("link", "")).strip()
                title = clean_text(entry.get("title", ""), 300)

                if not url or not title:
                    continue

                uid = hashlib.sha256(
                    url.encode("utf-8")
                ).hexdigest()

                summary = clean_text(
                    entry.get("summary", ""), 420
                )

                image_url = find_image(entry)
                published = entry.get("published", "")

                with db() as con:
                    cur = con.execute("""
                        INSERT OR IGNORE INTO articles
                        (id, title, summary, source, url,
                         category, published, language, image_url)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        uid,
                        title,
                        summary,
                        feed_info["name"],
                        url,
                        feed_info["category"],
                        published,
                        "en",
                        image_url
                    ))

                    added += cur.rowcount

        except Exception as exc:
            print(
                f"RSS xatosi ({feed_info['name']}): {exc}"
            )

    print(f"WorldPulse: {added} yangi maqola qo'shildi")


@app.on_event("startup")
def startup():
    init_db()

    if ENABLE_RSS_BOT:
        fetch_feeds()
        scheduler.add_job(
            fetch_feeds,
            "interval",
            minutes=15,
            id="rss_fetch",
            replace_existing=True
        )
        scheduler.start()


@app.on_event("shutdown")
def shutdown():
    if scheduler.running:
        scheduler.shutdown()


@app.get("/api/articles")
def articles(q: str = "", category: str = "all"):
    with db() as con:
        sql = "SELECT * FROM articles"
        args = []
        clauses = []

        if q:
            clauses.append("(title LIKE ? OR summary LIKE ?)")
            args.extend([f"%{q}%", f"%{q}%"])

        if category != "all":
            clauses.append("category = ?")
            args.append(category)

        if clauses:
            sql += " WHERE " + " AND ".join(clauses)

        sql += " ORDER BY rowid DESC LIMIT 100"
        rows = con.execute(sql, args).fetchall()

    return [dict(row) for row in rows]


@app.get("/api/status")
def status():
    with db() as con:
        count = con.execute(
            "SELECT COUNT(*) FROM articles"
        ).fetchone()[0]

    return {
        "project": "WorldPulse",
        "status": "running",
        "articles": count,
        "rss_bot_enabled": ENABLE_RSS_BOT
    }


@app.get("/")
def home():
    return FileResponse(BASE / "static" / "index.html")


app.mount(
    "/static",
    StaticFiles(directory=BASE / "static"),
    name="static"
)

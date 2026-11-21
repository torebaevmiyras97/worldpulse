from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import sqlite3, feedparser, hashlib, os
from apscheduler.schedulers.background import BackgroundScheduler
from .feeds import RSS_FEEDS

BASE = Path(__file__).resolve().parent.parent
DB = BASE / "worldpulse.db"
ENABLE_RSS_BOT = os.getenv("ENABLE_RSS_BOT", "false").lower() == "true"

app = FastAPI(title="WorldPulse API", version="0.1.0")
scheduler = BackgroundScheduler()

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
            language TEXT DEFAULT 'en'
        )
        """)

def fetch_feeds():
    init_db()
    added = 0
    for feed_info in RSS_FEEDS:
        try:
            parsed = feedparser.parse(feed_info["url"])
            for entry in parsed.entries[:20]:
                url = getattr(entry, "link", "").strip()
                title = getattr(entry, "title", "").strip()
                if not url or not title:
                    continue
                uid = hashlib.sha256(url.encode("utf-8")).hexdigest()
                summary = getattr(entry, "summary", "") or ""
                # Matnni qisqartiramiz; to'liq maqola ko'chirilmaydi.
                summary = " ".join(summary.replace("<p>", " ").replace("</p>", " ").split())[:420]
                published = getattr(entry, "published", "")
                with db() as con:
                    cur = con.execute(
                        """INSERT OR IGNORE INTO articles
                        (id,title,summary,source,url,category,published,language)
                        VALUES (?,?,?,?,?,?,?,?)""",
                        (uid, title, summary, feed_info["name"], url,
                         feed_info["category"], published, "en")
                    )
                    added += cur.rowcount
        except Exception as exc:
            print(f"RSS xatosi ({feed_info['name']}): {exc}")
    print(f"WorldPulse RSS: {added} yangi yozuv qo'shildi")

@app.on_event("startup")
def startup():
    init_db()
    if ENABLE_RSS_BOT:
        fetch_feeds()
        scheduler.add_job(fetch_feeds, "interval", minutes=15, id="rss_fetch", replace_existing=True)
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
            args += [f"%{q}%", f"%{q}%"]
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
        count = con.execute("SELECT COUNT(*) FROM articles").fetchone()[0]
    return {"project": "WorldPulse", "status": "running", "articles": count,
            "rss_bot_enabled": ENABLE_RSS_BOT}

@app.get("/")
def home():
    return FileResponse(BASE / "static" / "index.html")

app.mount("/static", StaticFiles(directory=BASE / "static"), name="static")

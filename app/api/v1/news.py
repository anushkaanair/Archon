"""GET /v1/news — live AI industry news pulled from public RSS feeds.

Results are cached for 30 minutes per process — no DB write needed for the
current scale. A background refresh task warms the cache on startup.
"""

from __future__ import annotations

import asyncio
import re
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/news", tags=["News"])


# Curated AI-relevant RSS feeds. All public, no API key required.
RSS_FEEDS: list[dict[str, str]] = [
    {"name": "OpenAI",      "url": "https://openai.com/news/rss.xml"},
    {"name": "Anthropic",   "url": "https://www.anthropic.com/news/rss.xml"},
    {"name": "Google DeepMind", "url": "https://deepmind.google/blog/rss.xml"},
    {"name": "HF blog",     "url": "https://huggingface.co/blog/feed.xml"},
    {"name": "MIT News AI", "url": "https://news.mit.edu/topic/mitartificial-intelligence2-rss.xml"},
]

_CACHE_TTL_SECONDS = 30 * 60
_cache: dict[str, Any] = {"items": [], "fetched_at": 0.0}


class NewsItem(BaseModel):
    id: str
    title: str
    summary: str
    link: str
    source: str
    published_at: str | None


class NewsResponse(BaseModel):
    items: list[NewsItem]
    fetched_at: str
    sources: list[str]


# ── RSS parser ──────────────────────────────────────────────────────────────


_ITEM_RE = re.compile(r"<item[\s\S]*?</item>|<entry[\s\S]*?</entry>", re.I)
_TAG_RE = re.compile(
    r"<(title|link|description|summary|content|pubDate|published|updated)[^>]*>([\s\S]*?)</\1>",
    re.I,
)
_LINK_HREF_RE = re.compile(r'<link[^>]*href="([^"]+)"', re.I)
_CDATA_RE = re.compile(r"<!\[CDATA\[([\s\S]*?)\]\]>")
_TAG_STRIP_RE = re.compile(r"<[^>]+>")


def _clean(text: str) -> str:
    """Strip CDATA + HTML tags + collapse whitespace."""
    if not text:
        return ""
    m = _CDATA_RE.search(text)
    if m:
        text = m.group(1)
    text = _TAG_STRIP_RE.sub("", text)
    return " ".join(text.split()).strip()


def _parse_feed(xml: str, source: str) -> list[dict[str, Any]]:
    """Parse RSS/Atom items into uniform dicts.

    Tolerant by design — broken feeds yield fewer items rather than raising.
    """
    items: list[dict[str, Any]] = []
    for match in list(_ITEM_RE.finditer(xml))[:8]:
        chunk = match.group(0)
        fields: dict[str, str] = {}
        for tag_match in _TAG_RE.finditer(chunk):
            tag = tag_match.group(1).lower()
            fields.setdefault(tag, _clean(tag_match.group(2)))

        # Atom feeds: <link href="..."/>
        if not fields.get("link"):
            href = _LINK_HREF_RE.search(chunk)
            if href:
                fields["link"] = href.group(1)

        title = fields.get("title") or ""
        link = fields.get("link") or ""
        summary = (
            fields.get("description")
            or fields.get("summary")
            or fields.get("content")
            or ""
        )
        published = (
            fields.get("pubdate")
            or fields.get("published")
            or fields.get("updated")
        )

        if not title or not link:
            continue

        items.append(
            {
                "id": f"{source}::{link[:80]}",
                "title": title[:200],
                "summary": summary[:300],
                "link": link,
                "source": source,
                "published_at": published,
            }
        )
    return items


async def _fetch_feed(client: httpx.AsyncClient, feed: dict[str, str]) -> list[dict[str, Any]]:
    try:
        resp = await client.get(feed["url"], timeout=6.0, follow_redirects=True)
        if resp.status_code != 200:
            return []
        return _parse_feed(resp.text, feed["name"])
    except Exception:
        return []


async def refresh_news() -> list[dict[str, Any]]:
    """Fetch all RSS feeds concurrently and update the in-process cache."""
    async with httpx.AsyncClient(headers={"User-Agent": "Archon-News/1.0"}) as client:
        all_results = await asyncio.gather(*(_fetch_feed(client, f) for f in RSS_FEEDS))
    items = [it for sub in all_results for it in sub]
    items.sort(key=lambda x: x.get("published_at") or "", reverse=True)
    items = items[:30]
    _cache["items"] = items
    _cache["fetched_at"] = asyncio.get_event_loop().time()
    return items


# ── Endpoint ────────────────────────────────────────────────────────────────


@router.get("", response_model=NewsResponse, summary="Live AI industry news")
async def get_news() -> NewsResponse:
    now = asyncio.get_event_loop().time()
    if not _cache["items"] or (now - _cache["fetched_at"]) > _CACHE_TTL_SECONDS:
        try:
            await refresh_news()
        except Exception:
            pass  # Serve stale cache if refresh failed
    return NewsResponse(
        items=[NewsItem(**it) for it in _cache["items"]],
        fetched_at=datetime.now(timezone.utc).isoformat(),
        sources=[f["name"] for f in RSS_FEEDS],
    )


@router.post("/refresh", response_model=NewsResponse, summary="Force-refresh the news cache")
async def force_refresh() -> NewsResponse:
    """Trigger an immediate RSS pull instead of waiting for the 30 min TTL."""
    await refresh_news()
    return await get_news()

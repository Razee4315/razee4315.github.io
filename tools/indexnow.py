"""Submit this host's URLs to IndexNow (Bing, Yandex, Naver, Seznam and others; not Google).

Reads every Sitemap line in the root robots.txt, follows sitemap indexes, and posts the URLs.
Standard library only.

    python tools/indexnow.py --all        # every URL in every sitemap
    python tools/indexnow.py --days 8     # only URLs whose <lastmod> is within the last 8 days
    python tools/indexnow.py --all --dry-run
"""
import argparse
import datetime as dt
import json
import sys
import urllib.request
import xml.etree.ElementTree as ET

HOST = "razee4315.github.io"
SITE = f"https://{HOST}/"
KEY = "008bf45f82aeb6885628481203d83550"
KEY_LOCATION = f"{SITE}{KEY}.txt"
ENDPOINT = "https://api.indexnow.org/indexnow"
NS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
UA = "razee4315-indexnow/1.0 (+https://github.com/Razee4315/razee4315.github.io)"


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def sitemaps_from_robots():
    text = get(SITE + "robots.txt").decode("utf-8")
    return [line.split(":", 1)[1].strip() for line in text.splitlines() if line.lower().startswith("sitemap:")]


def parse_date(value):
    if not value:
        return None
    try:
        return dt.datetime.fromisoformat(value.strip().replace("Z", "+00:00")).date()
    except ValueError:
        return None


def collect(sitemap_url, seen):
    """Yield (url, lastmod date or None) from a sitemap or sitemap index."""
    if sitemap_url in seen:
        return
    seen.add(sitemap_url)
    try:
        root = ET.fromstring(get(sitemap_url))
    except Exception as e:  # keep going if one project's sitemap is down
        print(f"skip {sitemap_url}: {e}", file=sys.stderr)
        return
    if root.tag == NS + "sitemapindex":
        for sm in root.iter(NS + "sitemap"):
            loc = sm.findtext(NS + "loc")
            if loc:
                yield from collect(loc.strip(), seen)
    else:
        for u in root.iter(NS + "url"):
            loc = u.findtext(NS + "loc")
            if loc:
                yield loc.strip(), parse_date(u.findtext(NS + "lastmod"))


def main():
    ap = argparse.ArgumentParser()
    mode = ap.add_mutually_exclusive_group(required=True)
    mode.add_argument("--all", action="store_true")
    mode.add_argument("--days", type=int)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    since = None if args.all else dt.date.today() - dt.timedelta(days=args.days)
    urls, seen = {}, set()
    for sm in sitemaps_from_robots():
        for loc, lastmod in collect(sm, seen):
            if not loc.startswith(SITE):
                continue
            if since is None or (lastmod and lastmod >= since):
                urls[loc] = True
    url_list = list(urls)
    print(f"{len(url_list)} URL(s) from {len(seen)} sitemap(s)")
    for u in url_list:
        print("  " + u)
    if not url_list or args.dry_run:
        return 0

    body = json.dumps({"host": HOST, "key": KEY, "keyLocation": KEY_LOCATION, "urlList": url_list[:10000]}).encode()
    req = urllib.request.Request(ENDPOINT, data=body, method="POST",
                                 headers={"Content-Type": "application/json; charset=utf-8", "User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            print(f"IndexNow response: {r.status}")
            return 0 if r.status in (200, 202) else 1
    except urllib.error.HTTPError as e:
        print(f"IndexNow error: {e.code} {e.read()[:300]!r}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())

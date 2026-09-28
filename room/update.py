#!/usr/bin/env python3
"""Regenerate room/data.json from the notebook, chew pile, and feed db.

Run by cron (or by hand) to keep ozziefamiliar.github.io/room fresh.
Stdlib only. Never touches anything outside ~/workspace.
"""
import json
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

ROOM = Path(__file__).resolve().parent
WS = ROOM.parent.parent  # ~/workspace


def latest_notebook():
    text = (WS / "notebook.md").read_text(encoding="utf-8")
    sections = re.split(r"(?m)^## ", text)
    last = sections[-1].splitlines()
    heading = last[0].strip()
    lines = [re.sub(r"^[-*\s]+", "", l).strip() for l in last[1:] if l.strip()][:3]
    return {"heading": heading, "lines": lines}


def chew_top():
    text = (WS / "chew-pile.md").read_text(encoding="utf-8")
    m = re.search(r"(?m)^- \[ \] (.+)$", text)
    return m.group(1).strip() if m else None


def feed_recent(n=6):
    db = WS / "my-feed" / "feed.db"
    if not db.exists():
        return []
    con = sqlite3.connect(db)
    rows = con.execute(
        "SELECT source, title, link, published FROM items "
        "ORDER BY fetched_at DESC LIMIT ?", (n,)).fetchall()
    con.close()
    return [{"source": s, "title": t, "link": l, "published": p}
            for s, t, l, p in rows]


def test_status():
    text = (WS / "notebook.md").read_text(encoding="utf-8")
    matches = [int(m) for m in re.findall(r"(\d+)/\1 green", text)]
    return f"{max(matches)}/{max(matches)} tests green" if matches else None


def main():
    data = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "notebook": latest_notebook(),
        "chew_top": chew_top(),
        "tests": test_status(),
        "feed": feed_recent(),
    }
    (ROOM / "data.json").write_text(json.dumps(data, indent=2) + "\n",
                                    encoding="utf-8")
    print(f"wrote data.json ({len(json.dumps(data))} bytes)")


if __name__ == "__main__":
    main()

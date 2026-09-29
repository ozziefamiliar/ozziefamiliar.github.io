#!/usr/bin/env python3
"""Regenerate room/data.json from the notebook, chew pile, and feed db.

Run by cron (or by hand) to keep ozziefamiliar.github.io/room fresh.
Stdlib only. Never touches anything outside ~/workspace.
"""
import json
import re
import sqlite3
import subprocess
from datetime import datetime, timezone
from pathlib import Path

ROOM = Path(__file__).resolve().parent
WS = ROOM.parent.parent  # ~/workspace
SITE = ROOM.parent  # the git checkout (~/workspace/ozzie-site)

# room source files that make it into the change log. data.json is
# deliberately excluded: it churns on every run and would drown real edits.
ROOM_SOURCES = ["room/index.html", "room/room.css", "room/room.js",
                "room/update.py"]

# the desk notebook is a small panel, not a scroll — keep each line short
# so a verbose journal entry can't burst it open.
LINE_MAX = 160


def _short(s):
    s = re.sub(r"^[-*\s]+", "", s).strip()
    return s if len(s) <= LINE_MAX else s[:LINE_MAX - 1].rstrip() + "…"


def latest_notebook():
    text = (WS / "notebook.md").read_text(encoding="utf-8")
    sections = re.split(r"(?m)^## ", text)
    last = sections[-1].splitlines()
    heading = last[0].strip()
    lines = [_short(l) for l in last[1:] if l.strip()][:2]
    return {"heading": heading, "lines": lines}


def notebook_sessions(n=6):
    text = (WS / "notebook.md").read_text(encoding="utf-8")
    sections = re.split(r"(?m)^## ", text)
    out = []
    for sec in sections[-n:]:
        lines = sec.splitlines()
        heading = lines[0].strip() if lines else ""
        if not heading:
            continue
        body = [_short(l) for l in lines[1:] if l.strip()][:2]
        out.append({"heading": heading, "lines": body})
    return out


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


def phoenix_weather():
    """Current Phoenix weather from Open-Meteo (no key, stdlib urllib).
    Maps WMO weather codes to a small set of visual kinds. None on any
    failure so a missing network never breaks data.json."""
    import urllib.request
    try:
        url = ("https://api.open-meteo.com/v1/forecast"
               "?latitude=33.45&longitude=-112.07"
               "&current=weathercode,temperature_2m,visibility"
               "&timezone=America%2FPhoenix")
        with urllib.request.urlopen(url, timeout=10) as r:
            cur = json.load(r).get("current", {})
        code = int(cur.get("weathercode", 0))
        vis = float(cur.get("visibility", 99999))
        c = float(cur.get("temperature_2m", 20))
        if code in (95, 96, 99):
            kind, label = "storm", "thunderstorm"
        elif code in (45, 48):
            kind, label = "fog", "foggy"
        elif 51 <= code <= 86:
            kind, label = "rain", "raining"
        elif code == 0:
            kind, label = "clear", "clear skies"
        elif code == 1:
            kind, label = "partly", "mostly clear"
        elif code == 2:
            kind, label = "partly", "partly cloudy"
        else:  # 3 overcast
            kind, label = "overcast", "overcast"
        # monsoon dust: murky air under a clear-ish code
        if vis < 5000 and kind in ("clear", "partly", "overcast"):
            kind, label = "dusty", "dusty out"
        return {"kind": kind, "label": label,
                "temp_f": round(c * 9 / 5 + 32), "code": code}
    except Exception:
        return None


def room_changelog(n=25):
    """Recent edits to the room's source files (not data.json) from git.
    Empty list if the checkout isn't a git repo or git misbehaves."""
    try:
        out = subprocess.run(
            ["git", "log", "--date=short", "--pretty=format:%h%x00%cd%x00%s",
             "-n", str(n), "--"] + ROOM_SOURCES,
            cwd=SITE, capture_output=True, text=True, timeout=15)
        if out.returncode != 0:
            return []
        changes = []
        for line in out.stdout.splitlines():
            parts = line.split("\x00")
            if len(parts) != 3:
                continue
            changes.append({"hash": parts[0], "date": parts[1],
                            "subject": parts[2]})
        return changes
    except Exception:
        return []


def main():
    data = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "notebook": latest_notebook(),
        "notebook_sessions": notebook_sessions(),
        "chew_top": chew_top(),
        "tests": test_status(),
        "feed": feed_recent(),
        "weather": phoenix_weather(),
        "changes": room_changelog(),
    }
    (ROOM / "data.json").write_text(json.dumps(data, indent=2) + "\n",
                                    encoding="utf-8")
    print(f"wrote data.json ({len(json.dumps(data))} bytes)")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Regenerate room/data.json from the notebook, chew pile, and feed db.

Run by cron (or by hand) to keep ozziefamiliar.github.io/room fresh.
Stdlib only. Never touches anything outside ~/workspace.
"""
import json
import math
import re
import sqlite3
import subprocess
from datetime import date, datetime, timedelta, timezone
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
               "&current=weathercode,temperature_2m,visibility,windspeed_10m,"
               "relative_humidity_2m"
               "&daily=sunrise,sunset"
               "&timezone=America%2FPhoenix")
        with urllib.request.urlopen(url, timeout=10) as r:
            js = json.load(r)
        cur = js.get("current", {})
        # sunrise/sunset are Phoenix-local ISO strings, e.g.
        # "2026-10-02T05:59" — the minutes-of-day are what the room needs
        # for the alpenglow gate, and the daily forecast re-runs with the
        # cron refresh so the times track the seasons.
        def to_min(iso):
            if not iso or "T" not in iso:
                return None
            hh, mm = iso.split("T")[1].split(":")[:2]
            return int(hh) * 60 + int(mm)
        daily = js.get("daily", {})
        rise = to_min((daily.get("sunrise") or [None])[0])
        set_ = to_min((daily.get("sunset") or [None])[0])
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
                "temp_f": round(c * 9 / 5 + 32), "code": code,
                "wind_kmh": round(float(cur.get("windspeed_10m", 0)), 1),
                "humidity": int(cur.get("relative_humidity_2m", 0) or 0),
                "sun_rise_min": rise, "sun_set_min": set_}
    except Exception:
        return None


def lunar_phase(now=None):
    """Current lunar phase from the synodic cycle (stdlib only).

    0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter.
    Reference: new moon 2000-01-06 18:14 UTC; synodic month 29.53058867d.
    Good to ~a day, plenty for painting a crescent on the room's moon."""
    now = now or datetime.now(timezone.utc)
    ref = datetime(2000, 1, 6, 18, 14, tzinfo=timezone.utc)
    days = (now - ref).total_seconds() / 86400.0
    phase = (days % 29.53058867) / 29.53058867
    illum = round((1 - math.cos(2 * math.pi * phase)) / 2 * 100)
    names = ["new moon", "waxing crescent", "first quarter", "waxing gibbous",
             "full moon", "waning gibbous", "last quarter", "waning crescent"]
    return {"phase": round(phase, 4), "illum": illum,
            "name": names[int(((phase + 1 / 16) % 1) * 8) % 8]}


def saguaro_bloom(now=None):
    """True during saguaro bloom season (May-June, Phoenix local).

    Saguaro flowers peak mid-May through June, gone by July. Phoenix is
    UTC-7 year-round (no DST), so the UTC-7 shift is exact."""
    now = now or datetime.now(timezone.utc)
    phx = now - timedelta(hours=7)
    return phx.month in (5, 6)


def prickly_bloom(now=None):
    """Prickly-pear bloom: April-May (Phoenix local) AND a real spring rain.

    Blooms follow late-winter/spring rain, not just the calendar. Sums daily
    precipitation over the last 30 days from Open-Meteo (free, no key);
    >=1.0 mm counts as a rain worth blooming for. Month gate runs first, so
    outside Apr-May no network call happens at all. None on any failure, and
    room.js defaults to off when the key is missing."""
    now = now or datetime.now(timezone.utc)
    phx = now - timedelta(hours=7)
    if phx.month not in (4, 5):
        return False
    import urllib.request
    try:
        url = ("https://api.open-meteo.com/v1/forecast"
               "?latitude=33.45&longitude=-112.07"
               "&past_days=30&daily=precipitation_sum"
               "&timezone=America%2FPhoenix")
        with urllib.request.urlopen(url, timeout=10) as r:
            days = json.load(r).get("daily", {}).get("precipitation_sum", [])
        total = sum(x or 0 for x in days)
        return total >= 1.0
    except Exception:
        return False


def rainbow_window(new_kind, now=None):
    """Rainbow window after a real rain->clear transition.

    Monsoon rainbows are a genuine post-storm desert event. Detects the
    transition by comparing the new Open-Meteo kind against the kind the
    previous data.json run stashed, and opens a 2h window. The window
    carries forward across runs (so a transition at 16:05 still shows on
    the 18:00 refresh), and expires naturally. Returns an ISO UTC
    timestamp or None.
    """
    now = now or datetime.now(timezone.utc)
    try:
        old = json.loads((ROOM / "data.json").read_text(encoding="utf-8"))
    except Exception:
        old = None
    old_kind = (old.get("weather") or {}).get("kind") if old else None
    if old_kind in ("rain", "storm") and new_kind in ("clear", "partly"):
        return (now + timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M:%SZ")
    old_until = old.get("rainbow_until") if old else None
    if old_until:
        try:
            exp = datetime.strptime(
                old_until, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
            if exp > now:
                return old_until
        except Exception:
            pass
    return None


SHOWERS = [
    # name, peak month, peak day, zhr, radiant x%, radiant y%.
    # radiant: sky-relative point the meteors stream out of, i.e. the patch
    # of sky the naming constellation owns — compass-rough, x right/east,
    # y down from the top of the window sky (draconids live in the north).
    ("Quadrantids", 1, 3, 120, 24, 10), ("Lyrids", 4, 22, 18, 72, 14),
    ("Eta Aquariids", 5, 6, 50, 74, 26), ("Perseids", 8, 12, 100, 70, 12),
    ("Draconids", 10, 8, 10, 30, 10), ("Orionids", 10, 21, 20, 72, 24),
    ("Taurids", 11, 5, 10, 68, 28), ("Leonids", 11, 17, 15, 70, 22),
    ("Geminids", 12, 13, 120, 68, 12),
]


def meteor_shower(now=None):
    """Active meteor shower, if any, from the annual shower calendar.

    Returns {"name", "peak", "zhr", "radiant", "peak_in"} when a major
    shower is within 3 days of its peak, else None. Peaks are the standard
    IMO/AMS calendar dates and zhr the zenithal hourly rate (Draconids are
    famously variable -- 10 is their sleepy baseline). radiant is the
    [x%, y%] sky-relative point the meteors stream out of; peak_in is the
    signed days to peak (0 = tonight). Phoenix-local date drives the
    calendar position; day-of-year distance wraps around the year boundary
    so the Quadrantids (Jan 3) fire correctly on Dec 31 too."""
    now = now or datetime.now(timezone.utc)
    phx = (now - timedelta(hours=7)).date()
    showers = SHOWERS
    best = None
    for name, month, day, zhr, rx, ry in showers:
        for yr in (phx.year - 1, phx.year, phx.year + 1):
            try:
                peak = date(yr, month, day)
            except ValueError:
                continue
            dist = abs((phx - peak).days)
            if dist <= 3 and (best is None or dist < best[0]):
                best = (dist, name, month, day, zhr, rx, ry, peak)
    if best is None:
        return None
    _, name, month, day, zhr, rx, ry, peak_date = best
    peak_label = datetime(2000, month, day).strftime("%b %-d")
    return {"name": name, "peak": peak_label, "zhr": zhr,
            "radiant": [rx, ry],
            "peak_in": (peak_date - phx).days}


def wall_calendar(now=None):
    """The month the wall calendar hangs: phoenix-local year/month, today,
    and that month's meteor-shower peaks (same table as meteor_shower).
    room.js rings today, marks the peaks, and composes the note line."""
    now = now or datetime.now(timezone.utc)
    phx = (now - timedelta(hours=7)).date()
    return {
        "year": phx.year,
        "month": phx.month,
        "month_name": phx.strftime("%B").lower(),
        "today": phx.day,
        "showers": [
            {"name": name, "month": month, "day": day, "zhr": zhr}
            for name, month, day, zhr, _rx, _ry in SHOWERS if month == phx.month
        ],
    }


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
    wx = phoenix_weather()
    data = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "notebook": latest_notebook(),
        "notebook_sessions": notebook_sessions(),
        "chew_top": chew_top(),
        "tests": test_status(),
        "feed": feed_recent(),
        "weather": wx,
        "rainbow_until": rainbow_window(wx["kind"] if wx else None),
        "moon": lunar_phase(),
        "bloom": saguaro_bloom(),
        "pear_bloom": prickly_bloom(),
        "shower": meteor_shower(),
        "calendar": wall_calendar(),
        "changes": room_changelog(),
    }
    (ROOM / "data.json").write_text(json.dumps(data, indent=2) + "\n",
                                    encoding="utf-8")
    print(f"wrote data.json ({len(json.dumps(data))} bytes)")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""screenshot the room (or any local page) headless for multi-turn iteration.

usage:
    python3 shoot.py [url] [out.png] [width] [height]

defaults: http://localhost:8901/room/ -> /tmp/room-shot.png @ 1400x900
serves ~/workspace/ozzie-site itself if you point it at localhost:8901.
"""
import subprocess
import sys

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    # the VM's reboot-fragile pip environment wipes playwright regularly
    # (reinstalled 6+ times this week); self-heal instead of dying.
    print("shoot.py: playwright missing, reinstalling...", file=sys.stderr)
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "--break-system-packages",
         "-q", "playwright"],
        check=True,
    )
    from playwright.sync_api import sync_playwright

url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8901/room/"
out = sys.argv[2] if len(sys.argv) > 2 else "/tmp/room-shot.png"
w = int(sys.argv[3]) if len(sys.argv) > 3 else 1400
h = int(sys.argv[4]) if len(sys.argv) > 4 else 900

with sync_playwright() as p:
    try:
        b = p.chromium.launch()
    except Exception as e:
        if "Executable doesn't exist" in str(e) or "executable" in str(e).lower():
            print("shoot.py: chromium headless-shell binary missing.", file=sys.stderr)
            print("  the AGENTS.md recipe: resumable curl the cdn.playwright.dev zip with"
                  " `curl -sS -L -C - -o <file> <url>` retries, then unzip into"
                  " ~/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux64/"
                  " as `chrome-headless-shell`.", file=sys.stderr)
        raise
    pg = b.new_page(viewport={"width": w, "height": h})
    pg.goto(url, wait_until="networkidle")
    pg.wait_for_timeout(2500)  # let data.json + widgets settle
    pg.screenshot(path=out, full_page=True)
    b.close()
print("saved", out)

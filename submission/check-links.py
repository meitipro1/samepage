#!/usr/bin/env python3
"""
Open every link in submission/portal.md once and say what came back.

    python submission/check-links.py [file, default submission/portal.md]

Explorer transaction links are checked through the explorer's own API: the
hash must exist and be ACCEPTED or FINALIZED. Every other link must answer 200.
"""

import json
import pathlib
import re
import sys
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")
EXPLORER = "https://explorer-studio-dev.genlayer.com"
target = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(__file__).parent / "portal.md"
text = target.read_text(encoding="utf-8")
links = sorted(set(re.findall(r"https?://[^\s)>\]]+", text)))
failed = 0
for url in links:
    url = url.rstrip(".,")
    try:
        match = re.match(re.escape(EXPLORER) + r"/tx/(0x[0-9a-f]{64})$", url)
        if match:
            api = urllib.request.Request(f"{EXPLORER}/api/transactions/{match.group(1)}", headers={"User-Agent": "samepage-link-check"})
            with urllib.request.urlopen(api, timeout=30) as r:
                status = json.load(r)["transaction"]["status"]
            ok = status in ("ACCEPTED", "FINALIZED")
            print(f"{'ok ' if ok else 'BAD'} {status:9} {url}")
        else:
            request = urllib.request.Request(url, headers={"User-Agent": "samepage-link-check"})
            with urllib.request.urlopen(request, timeout=30) as r:
                ok = r.status == 200
            print(f"{'ok ' if ok else 'BAD'} {r.status:9} {url}")
    except Exception as error:  # noqa: BLE001
        ok = False
        print(f"BAD {str(error)[:40]:9} {url}")
    failed += 0 if ok else 1
print(f"\n{len(links) - failed} of {len(links)} links resolve")
sys.exit(1 if failed else 0)

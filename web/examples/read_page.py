"""
Read a page from the deployed contract with genlayer-py 0.19.0rc2.

    python web/examples/read_page.py 2

Reads are free, but genlayer-py reads through an account, so a throwaway one
is made here. It is never funded and never signs.
"""

import json
import pathlib
import sys

from genlayer_py import create_account, create_client
from genlayer_py.chains import studio_devnet

deployment = json.loads((pathlib.Path(__file__).resolve().parent.parent / "lib" / "deployment.json").read_text())
studio_devnet.rpc_urls = {"default": {"http": [deployment["rpc"]]}}
client = create_client(chain=studio_devnet, account=create_account())

page_id = int(sys.argv[1]) if len(sys.argv) > 1 else 1
page = json.loads(client.read_contract(address=deployment["samepage"], function_name="get_page", args=[page_id]))
if not page["found"]:
    raise SystemExit(f"no page {page_id}")
print(f"page {page['id']}: {page['title']} ({page['status']}, step {page['step']}, round {page['round']})")
for r in page["rounds"]:
    if r["verdict"]:
        print(f"  round {r['number']}: {r['verdict']} {r['count']}")
        for term, status in r["statuses"].items():
            print(f"    {term:13} {status:7} {r['notes'].get(term, '')}")

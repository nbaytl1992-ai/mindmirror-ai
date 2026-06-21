#!/usr/bin/env python3
import json, time, urllib.request
from pathlib import Path
import jwt

key = (Path.home() / "startup/mindmirror-ai/AuthKey_PXU75Z3V77.p8").read_text()
now = int(time.time())
token = jwt.encode(
    {"iss": "0a48aa09-6990-4e92-8ae3-d90acc25e6bc", "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
    key,
    algorithm="ES256",
    headers={"kid": "PXU75Z3V77", "typ": "JWT"},
)
H = {"Authorization": f"Bearer {token}"}

for sid in ["6770884039", "6770884810"]:
    r = urllib.request.Request(
        f"https://api.appstoreconnect.apple.com/v1/subscriptions/{sid}", headers=H
    )
    d = json.loads(urllib.request.urlopen(r).read())
    prices = urllib.request.urlopen(
        urllib.request.Request(
            f"https://api.appstoreconnect.apple.com/v1/subscriptions/{sid}/prices?limit=1",
            headers=H,
        )
    )
    pmeta = json.loads(prices.read()).get("meta", {}).get("paging", {})
    print(sid, "state=", d["data"]["attributes"]["state"], "price_count=", pmeta.get("total"))

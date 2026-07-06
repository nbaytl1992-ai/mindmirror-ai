#!/usr/bin/env python3
"""Try adding CHN to subscription availability."""
import json, time, urllib.request, urllib.error
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
H = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

for sid in ["6770884039", "6770884810"]:
    for territory in ["CHN", "HKG", "TWN"]:
        body = {
            "data": {
                "type": "subscriptionAvailabilityAvailableTerritories",
                "relationships": {
                    "subscriptionAvailability": {
                        "data": {"type": "subscriptionAvailabilities", "id": sid}
                    },
                    "territory": {"data": {"type": "territories", "id": territory}},
                },
            }
        }
        data = json.dumps(body).encode()
        req = urllib.request.Request(
            "https://api.appstoreconnect.apple.com/v1/subscriptionAvailabilityAvailableTerritories",
            data=data,
            headers=H,
            method="POST",
        )
        try:
            resp = urllib.request.urlopen(req)
            print(sid, territory, "OK", resp.status)
        except urllib.error.HTTPError as e:
            print(sid, territory, e.code, e.read().decode()[:250])

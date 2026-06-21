#!/usr/bin/env python3
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


def get(p):
    r = urllib.request.Request(f"https://api.appstoreconnect.apple.com{p}", headers=H)
    return json.loads(urllib.request.urlopen(r).read())


def post(p, body):
    data = json.dumps(body).encode()
    r = urllib.request.Request(f"https://api.appstoreconnect.apple.com{p}", data=data, headers=H, method="POST")
    try:
        return json.loads(urllib.request.urlopen(r).read())
    except urllib.error.HTTPError as e:
        return {"error": e.read().decode()}


for sid in ["6770884039", "6770884810"]:
    sub = get(f"/v1/subscriptions/{sid}")
    print(sid, "state=", sub["data"]["attributes"]["state"])
    try:
        terr = get(f"/v1/subscriptionAvailabilities/{sid}/availableTerritories?limit=10")
        print("  territories sample:", [x["id"] for x in terr.get("data", [])[:10]], "total", terr.get("meta", {}))
    except urllib.error.HTTPError as e:
        print("  territories err:", e.read().decode()[:200])

    res = post(
        "/v1/subscriptionSubmissions",
        {
            "data": {
                "type": "subscriptionSubmissions",
                "relationships": {"subscription": {"data": {"type": "subscriptions", "id": sid}}},
            }
        },
    )
    print("  submit:", json.dumps(res)[:400])

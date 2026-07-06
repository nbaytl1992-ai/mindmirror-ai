#!/usr/bin/env python3
"""Recreate subscription availability with all priced territories."""
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

import jwt

ISSUER = "0a48aa09-6990-4e92-8ae3-d90acc25e6bc"
KEY_ID = "PXU75Z3V77"
SUBS = ["6770884039", "6770884810"]


class ASC:
    def __init__(self):
        key = (Path.home() / "startup/mindmirror-ai/AuthKey_PXU75Z3V77.p8").read_text()
        now = int(time.time())
        token = jwt.encode(
            {"iss": ISSUER, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
            key,
            algorithm="ES256",
            headers={"kid": KEY_ID, "typ": "JWT"},
        )
        self.h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    def get(self, path: str) -> dict:
        req = urllib.request.Request(
            f"https://api.appstoreconnect.apple.com{path}", headers=self.h
        )
        return json.loads(urllib.request.urlopen(req).read())

    def delete(self, path: str) -> None:
        req = urllib.request.Request(
            f"https://api.appstoreconnect.apple.com{path}", headers=self.h, method="DELETE"
        )
        try:
            urllib.request.urlopen(req)
            print("DELETE OK", path)
        except urllib.error.HTTPError as e:
            print("DELETE", path, e.code, e.read().decode()[:300])

    def post(self, path: str, body: dict) -> dict:
        data = json.dumps(body).encode()
        req = urllib.request.Request(
            f"https://api.appstoreconnect.apple.com{path}",
            data=data,
            headers=self.h,
            method="POST",
        )
        try:
            with urllib.request.urlopen(req) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            raise RuntimeError(e.read().decode()) from e


def priced_territories(api: ASC, sub_id: str) -> list[str]:
    ids: list[str] = []
    url = f"/v1/subscriptions/{sub_id}/prices?include=territory&limit=200"
    while url:
        path = url.replace("https://api.appstoreconnect.apple.com", "")
        data = api.get(path)
        for row in data.get("data", []):
            tid = row.get("relationships", {}).get("territory", {}).get("data", {}).get("id")
            if tid:
                ids.append(tid)
        url = data.get("links", {}).get("next")
    return sorted(set(ids))


def main() -> None:
    api = ASC()
    for sub_id in SUBS:
        tids = priced_territories(api, sub_id)
        print(f"\n{sub_id}: {len(tids)} priced territories", flush=True)

        api.delete(f"/v1/subscriptionAvailabilities/{sub_id}")

        body = {
            "data": {
                "type": "subscriptionAvailabilities",
                "attributes": {"availableInNewTerritories": False},
                "relationships": {
                    "subscription": {"data": {"type": "subscriptions", "id": sub_id}},
                    "availableTerritories": {
                        "data": [{"type": "territories", "id": t} for t in tids]
                    },
                },
            }
        }
        try:
            res = api.post("/v1/subscriptionAvailabilities", body)
            print("created availability", res.get("data", {}).get("id"))
        except RuntimeError as e:
            print("create failed:", str(e)[:800])

        sub = api.get(f"/v1/subscriptions/{sub_id}")
        print("state:", sub["data"]["attributes"]["state"])


if __name__ == "__main__":
    main()

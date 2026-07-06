#!/usr/bin/env python3
"""Set automatic worldwide subscription pricing via inAppPurchasePriceSchedules."""
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

import jwt

KEY_ID, ISSUER = "PXU75Z3V77", "0a48aa09-6990-4e92-8ae3-d90acc25e6bc"
SUBS = ["6770884039", "6770884810"]
USA_PP = {
    "6770884039": "eyJzIjoiNjc3MDg4NDAzOSIsInQiOiJVU0EiLCJwIjoiMTAwMzYifQ",
    "6770884810": "eyJzIjoiNjc3MDg4NDgxMCIsInQiOiJVU0EiLCJwIjoiMTAxNzcifQ",
}


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
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())

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


def main() -> None:
    api = ASC()
    for sub_id in SUBS:
        print(f"\n=== Price schedule for {sub_id} ===", flush=True)
        body = {
            "data": {
                "type": "subscriptionPriceSchedules",
                "relationships": {
                    "subscription": {"data": {"type": "subscriptions", "id": sub_id}},
                    "baseTerritory": {"data": {"type": "territories", "id": "USA"}},
                    "manualPrices": {"data": []},
                },
            },
            "included": [
                {
                    "type": "subscriptionPrices",
                    "id": "${price1}",
                    "attributes": {"startDate": None},
                    "relationships": {
                        "subscription": {"data": {"type": "subscriptions", "id": sub_id}},
                        "subscriptionPricePoint": {
                            "data": {
                                "type": "subscriptionPricePoints",
                                "id": USA_PP[sub_id],
                            }
                        },
                    },
                }
            ],
        }
        # Try simpler inAppPurchasePriceSchedules shape
        simple = {
            "data": {
                "type": "subscriptionPriceSchedules",
                "relationships": {
                    "subscription": {"data": {"type": "subscriptions", "id": sub_id}},
                    "baseTerritory": {"data": {"type": "territories", "id": "USA"}},
                },
            }
        }
        try:
            res = api.post("/v1/subscriptionPriceSchedules", simple)
            print(json.dumps(res, indent=2)[:1500], flush=True)
        except RuntimeError as e:
            print("schedule failed:", str(e)[:1200], flush=True)

        sub = api.get(f"/v1/subscriptions/{sub_id}")
        print("state:", sub["data"]["attributes"]["state"], flush=True)


if __name__ == "__main__":
    main()

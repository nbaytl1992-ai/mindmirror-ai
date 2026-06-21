#!/usr/bin/env python3
"""Apply worldwide equalized prices from USA base price point."""
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

import jwt

KEY_ID, ISSUER = "PXU75Z3V77", "0a48aa09-6990-4e92-8ae3-d90acc25e6bc"
SUBS = {
    "6770884039": "eyJzIjoiNjc3MDg4NDAzOSIsInQiOiJVU0EiLCJwIjoiMTAwMzYifQ",  # $2.99
    "6770884810": "eyJzIjoiNjc3MDg4NDgxMCIsInQiOiJVU0EiLCJwIjoiMTAxNzcifQ",  # $19.99
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

    def post(self, path: str, body: dict) -> dict | None:
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
            err = e.read().decode()
            if "ENTITY_ERROR" in err and "already" in err.lower():
                return None
            if "409" in err:
                return None
            raise RuntimeError(err[:300]) from e


def main() -> None:
    api = ASC()
    for sub_id, usa_pp in SUBS.items():
        print(f"\n=== Equalizing {sub_id} ===")
        url = f"/v1/subscriptionPricePoints/{usa_pp}/equalizations?limit=200"
        eq = api.get(url)
        points = eq.get("data", [])
        print(f"Equalization price points: {len(points)}")

        created = skipped = failed = 0
        for pp in points:
            pp_id = pp["id"]
            body = {
                "data": {
                    "type": "subscriptionPrices",
                    "relationships": {
                        "subscription": {"data": {"type": "subscriptions", "id": sub_id}},
                        "subscriptionPricePoint": {
                            "data": {"type": "subscriptionPricePoints", "id": pp_id}
                        },
                    },
                }
            }
            try:
                res = api.post("/v1/subscriptionPrices", body)
                if res:
                    created += 1
                else:
                    skipped += 1
            except RuntimeError:
                failed += 1

        print(f"created={created} skipped={skipped} failed={failed}")
        sub = api.get(f"/v1/subscriptions/{sub_id}")
        print("state:", sub["data"]["attributes"]["state"])

        prices = api.get(f"/v1/subscriptions/{sub_id}/prices?limit=1")
        total = prices.get("meta", {}).get("paging", {}).get("total")
        print("total price rows:", total)


if __name__ == "__main__":
    main()

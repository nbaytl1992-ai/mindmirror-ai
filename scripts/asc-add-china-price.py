#!/usr/bin/env python3
"""Add China pricing/availability and trigger price equalization."""
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

import jwt

KEY_ID, ISSUER = "PXU75Z3V77", "0a48aa09-6990-4e92-8ae3-d90acc25e6bc"
SUB_MONTHLY, SUB_YEARLY = "6770884039", "6770884810"


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


def add_territory_price(api: ASC, sub_id: str, territory: str, target_usd: str) -> None:
    print(f"\n--- {sub_id} territory={territory} ---")
    points = api.get(
        f"/v1/subscriptions/{sub_id}/pricePoints"
        f"?filter[territory]={territory}&limit=50"
    )
    items = points.get("data", [])
    print(f"price points: {len(items)}")
    match = None
    for p in items:
        cp = p.get("attributes", {}).get("customerPrice", "")
        if cp == target_usd or cp.startswith(target_usd[:3]):
            match = p
            break
    if not match and items:
        # pick closest tier
        match = items[0]
    if not match:
        print("No price point found")
        return

    pp_id = match["id"]
    cp = match["attributes"].get("customerPrice")
    print(f"Using price point {pp_id} customerPrice={cp}")

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
        print("Created price:", json.dumps(res, indent=2)[:800])
    except RuntimeError as e:
        print("Create price:", str(e)[:600])

    sub = api.get(f"/v1/subscriptions/{sub_id}")
    print("Subscription state:", sub["data"]["attributes"]["state"])


def main() -> None:
    api = ASC()
    # China mainland + Hong Kong + common test regions
    for territory, monthly, yearly in [
        ("CHN", "18.0", "128.0"),  # approximate CNY tiers — API returns local currency
        ("HKG", "23.0", "158.0"),
        ("TWN", "90.0", "590.0"),
    ]:
        try:
            add_territory_price(api, SUB_MONTHLY, territory, monthly)
            add_territory_price(api, SUB_YEARLY, territory, yearly)
        except Exception as e:
            print("err", territory, e)

    for sid in [SUB_MONTHLY, SUB_YEARLY]:
        prices = api.get(f"/v1/subscriptions/{sid}/prices?include=territory&limit=20")
        territories = []
        for row in prices.get("data", []):
            tid = row.get("relationships", {}).get("territory", {}).get("data", {}).get("id")
            if tid:
                territories.append(tid)
        print(f"{sid} price territories:", territories)


if __name__ == "__main__":
    main()

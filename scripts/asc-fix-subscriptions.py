#!/usr/bin/env python3
"""Diagnose and fix ASC subscription MISSING_METADATA."""
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import jwt

KEY_ID = "PXU75Z3V77"
ISSUER_ID = "0a48aa09-6990-4e92-8ae3-d90acc25e6bc"
APP_ID = "6770541682"
GROUP_VIP = "22099577"
GROUP_PREMIUM = "22103468"
SUB_MONTHLY = "6770884039"
SUB_YEARLY = "6770884810"


def find_key() -> Path:
    p = Path.home() / "startup/mindmirror-ai/AuthKey_PXU75Z3V77.p8"
    if not p.exists():
        p = Path("/mnt/d/Desktop/Hermers/AuthKey_PXU75Z3V77.p8")
    if not p.exists():
        raise FileNotFoundError("Auth key missing")
    return p


class ASC:
    def __init__(self):
        key = find_key().read_text()
        now = int(time.time())
        token = jwt.encode(
            {"iss": ISSUER_ID, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
            key,
            algorithm="ES256",
            headers={"kid": KEY_ID, "typ": "JWT"},
        )
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

    def get(self, path: str) -> dict:
        req = urllib.request.Request(
            f"https://api.appstoreconnect.apple.com{path}", headers=self.headers
        )
        with urllib.request.urlopen(req) as r:
            return json.loads(r.read())

    def post(self, path: str, body: dict) -> dict:
        data = json.dumps(body).encode()
        req = urllib.request.Request(
            f"https://api.appstoreconnect.apple.com{path}",
            data=data,
            headers=self.headers,
            method="POST",
        )
        try:
            with urllib.request.urlopen(req) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            raise RuntimeError(e.read().decode()) from e

    def patch(self, path: str, body: dict) -> dict:
        data = json.dumps(body).encode()
        req = urllib.request.Request(
            f"https://api.appstoreconnect.apple.com{path}",
            data=data,
            headers=self.headers,
            method="PATCH",
        )
        try:
            with urllib.request.urlopen(req) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            raise RuntimeError(e.read().decode()) from e


def main() -> None:
    api = ASC()

    print("=== Group localizations (VIP) ===")
    gl = api.get(f"/v1/subscriptionGroups/{GROUP_VIP}/subscriptionGroupLocalizations")
    print(json.dumps(gl, indent=2))

    print("\n=== Group localizations (MindMirror Premium - empty group?) ===")
    gl2 = api.get(f"/v1/subscriptionGroups/{GROUP_PREMIUM}/subscriptionGroupLocalizations")
    print(json.dumps(gl2, indent=2))

    for sid in [SUB_MONTHLY, SUB_YEARLY]:
        print(f"\n=== Prices {sid} ===")
        try:
            prices = api.get(f"/v1/subscriptions/{sid}/prices?limit=5")
            print(json.dumps(prices, indent=2)[:2500])
        except RuntimeError as e:
            print("prices err:", str(e)[:500])

        print(f"=== Availability {sid} ===")
        try:
            avail = api.get(f"/v1/subscriptions/{sid}/subscriptionAvailability")
            print(json.dumps(avail, indent=2))
        except RuntimeError as e:
            print("availability err:", str(e)[:500])

        print(f"=== Review screenshot {sid} ===")
        try:
            shot = api.get(f"/v1/subscriptions/{sid}/appStoreReviewScreenshot")
            print(json.dumps(shot, indent=2))
        except RuntimeError as e:
            print("screenshot err:", str(e)[:500])

    # Create group localization if missing on VIP
    gl_data = api.get(f"/v1/subscriptionGroups/{GROUP_VIP}/subscriptionGroupLocalizations")
    if not gl_data.get("data"):
        print("\n>>> Creating VIP group localization en-US...")
        body = {
            "data": {
                "type": "subscriptionGroupLocalizations",
                "attributes": {
                    "name": "MindMirror Premium",
                    "customAppName": "MindMirror AI",
                    "locale": "en-US",
                },
                "relationships": {
                    "subscriptionGroup": {
                        "data": {"type": "subscriptionGroups", "id": GROUP_VIP}
                    }
                },
            }
        }
        try:
            res = api.post("/v1/subscriptionGroupLocalizations", body)
            print("Created:", json.dumps(res, indent=2))
        except RuntimeError as e:
            print("Create failed:", e)

        print(">>> Creating VIP group localization zh-Hans...")
        body["data"]["attributes"] = {
            "name": "MindMirror 高级会员",
            "customAppName": "MindMirror AI",
            "locale": "zh-Hans",
        }
        try:
            res = api.post("/v1/subscriptionGroupLocalizations", body)
            print("Created:", json.dumps(res, indent=2))
        except RuntimeError as e:
            print("Create zh failed:", e)
    else:
        print("\nGroup localizations already exist:", len(gl_data["data"]))

    for sid in [SUB_MONTHLY, SUB_YEARLY]:
        print(f"\n=== Territories {sid} ===")
        t = api.get(f"/v1/subscriptionAvailabilities/{sid}/availableTerritories?limit=250")
        ids = [x["id"] for x in t.get("data", [])]
        print("count:", len(ids), "has CHN:", "CHN" in ids, "has USA:", "USA" in ids)

    # Try subscription submission (moves to review if ready)
    for sid in [SUB_MONTHLY, SUB_YEARLY]:
        sub = api.get(f"/v1/subscriptions/{sid}")
        state = sub["data"]["attributes"]["state"]
        print(f"\n{sid} state before submit: {state}")
        if state == "MISSING_METADATA":
            continue
        try:
            body = {
                "data": {
                    "type": "subscriptionSubmissions",
                    "relationships": {
                        "subscription": {
                            "data": {"type": "subscriptions", "id": sid}
                        }
                    },
                }
            }
            res = api.post("/v1/subscriptionSubmissions", body)
            print("submitted:", json.dumps(res, indent=2)[:500])
        except RuntimeError as e:
            print("submit failed:", str(e)[:800])


if __name__ == "__main__":
    main()

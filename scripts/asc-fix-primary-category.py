#!/usr/bin/env python3
"""Set App Store primary category on appInfo (required for version review)."""
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

import jwt

ISSUER = "0a48aa09-6990-4e92-8ae3-d90acc25e6bc"
KEY_ID = "PXU75Z3V77"
INFO_ID = "3ca4fecc-a174-4ac6-a76e-087c41a9f64d"
# Health & Fitness — common for wellness/diary apps
CATEGORY_ID = "GAMES"  # placeholder, will list and pick


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

    def get(self, p: str) -> dict:
        r = urllib.request.Request(f"https://api.appstoreconnect.apple.com{p}", headers=self.h)
        return json.loads(urllib.request.urlopen(r).read())

    def patch(self, p: str, body: dict) -> dict:
        data = json.dumps(body).encode()
        r = urllib.request.Request(
            f"https://api.appstoreconnect.apple.com{p}",
            data=data,
            headers=self.h,
            method="PATCH",
        )
        try:
            return json.loads(urllib.request.urlopen(r).read())
        except urllib.error.HTTPError as e:
            return json.loads(e.read())


def main() -> None:
    api = ASC()
    cats = api.get("/v1/appCategories?limit=200")
    health = None
    lifestyle = None
    for c in cats.get("data", []):
        aid = c["id"]
        name = c.get("attributes", {}).get("name", "")
        if "HEALTH" in aid or "Health" in name:
            health = aid
        if "LIFESTYLE" in aid or "Lifestyle" in name:
            lifestyle = aid
    cat_id = health or lifestyle or "HEALTH_AND_FITNESS"
    print("Using category:", cat_id)

    res = api.patch(
        f"/v1/appInfos/{INFO_ID}",
        {
            "data": {
                "type": "appInfos",
                "id": INFO_ID,
                "relationships": {
                    "primaryCategory": {"data": {"type": "appCategories", "id": cat_id}}
                },
            }
        },
    )
    print(json.dumps(res, indent=2)[:1200])


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Set privacy policy URL and inspect app version for IAP submission."""
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

import jwt

KEY_ID, ISSUER = "PXU75Z3V77", "0a48aa09-6990-4e92-8ae3-d90acc25e6bc"
APP_ID = "6770541682"
PRIVACY_URL = "https://jim1992nba.github.io/mindmirror-ai/privacy.html"


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

    def patch(self, path: str, body: dict) -> dict:
        data = json.dumps(body).encode()
        req = urllib.request.Request(
            f"https://api.appstoreconnect.apple.com{path}",
            data=data,
            headers=self.h,
            method="PATCH",
        )
        try:
            with urllib.request.urlopen(req) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            raise RuntimeError(e.read().decode()) from e


def main() -> None:
    api = ASC()

    infos = api.get(f"/v1/apps/{APP_ID}/appInfos?limit=5")
    print("appInfos:", json.dumps(infos, indent=2)[:2000])

    for info in infos.get("data", []):
        info_id = info["id"]
        locs = api.get(f"/v1/appInfos/{info_id}/appInfoLocalizations")
        print(f"\nLocalizations for {info_id}:")
        print(json.dumps(locs, indent=2)[:3000])

        for loc in locs.get("data", []):
            loc_id = loc["id"]
            locale = loc["attributes"].get("locale")
            current = loc["attributes"].get("privacyPolicyUrl")
            print(f"  {locale} privacy={current}")

            if locale in ("zh-Hans", "en-US") and not current:
                body = {
                    "data": {
                        "type": "appInfoLocalizations",
                        "id": loc_id,
                        "attributes": {"privacyPolicyUrl": PRIVACY_URL},
                    }
                }
                try:
                    res = api.patch(f"/v1/appInfoLocalizations/{loc_id}", body)
                    print(f"  -> patched {locale}:", res["data"]["attributes"].get("privacyPolicyUrl"))
                except RuntimeError as e:
                    print(f"  -> patch failed {locale}:", str(e)[:400])

    print("\n=== App Store Versions ===")
    try:
        versions = api.get(
            f"/v1/apps/{APP_ID}/appStoreVersions?filter[platform]=IOS&limit=5"
        )
        print(json.dumps(versions, indent=2)[:2500])
    except Exception as e:
        print("versions err", e)

    for sid in ["6770884039", "6770884810"]:
        sub = api.get(f"/v1/subscriptions/{sid}")
        print(sid, "state=", sub["data"]["attributes"]["state"])


if __name__ == "__main__":
    main()

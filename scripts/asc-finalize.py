#!/usr/bin/env python3
"""Finalize ASC: en-US privacy, group submission, re-check states."""
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

import jwt

ISSUER = "0a48aa09-6990-4e92-8ae3-d90acc25e6bc"
KEY_ID = "PXU75Z3V77"
APP_ID = "6770541682"
INFO_ID = "3ca4fecc-a174-4ac6-a76e-087c41a9f64d"
GROUP_VIP = "22099577"
PRIVACY = "https://jim1992nba.github.io/mindmirror-ai/privacy.html"


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

    def post(self, p: str, body: dict) -> dict:
        data = json.dumps(body).encode()
        r = urllib.request.Request(
            f"https://api.appstoreconnect.apple.com{p}", data=data, headers=self.h, method="POST"
        )
        try:
            return json.loads(urllib.request.urlopen(r).read())
        except urllib.error.HTTPError as e:
            return json.loads(e.read())

    def patch(self, p: str, body: dict) -> dict:
        data = json.dumps(body).encode()
        r = urllib.request.Request(
            f"https://api.appstoreconnect.apple.com{p}", data=data, headers=self.h, method="PATCH"
        )
        try:
            return json.loads(urllib.request.urlopen(r).read())
        except urllib.error.HTTPError as e:
            return json.loads(e.read())


def main() -> None:
    api = ASC()

    # en-US app info localization
    try:
        res = api.post(
            "/v1/appInfoLocalizations",
            {
                "data": {
                    "type": "appInfoLocalizations",
                    "attributes": {
                        "locale": "en-US",
                        "name": "MindMirror AI",
                        "privacyPolicyUrl": PRIVACY,
                    },
                    "relationships": {
                        "appInfo": {"data": {"type": "appInfos", "id": INFO_ID}}
                    },
                }
            },
        )
        print("en-US loc:", json.dumps(res, indent=2)[:500])
    except Exception as e:
        print("en-US loc err", e)

    # group submission
    res = api.post(
        "/v1/subscriptionGroupSubmissions",
        {"data": {"type": "subscriptionGroupSubmissions", "relationships": {
            "subscriptionGroup": {"data": {"type": "subscriptionGroups", "id": GROUP_VIP}}
        }}},
    )
    print("group submit:", json.dumps(res, indent=2)[:800])

    for sid in ["6770884039", "6770884810"]:
        sub = api.get(f"/v1/subscriptions/{sid}")
        print(sid, sub["data"]["attributes"]["state"])


if __name__ == "__main__":
    main()

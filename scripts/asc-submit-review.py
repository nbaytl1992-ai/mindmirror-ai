#!/usr/bin/env python3
"""Try to attach subscriptions + version and submit for review via ASC API."""
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

import jwt

ISSUER = "0a48aa09-6990-4e92-8ae3-d90acc25e6bc"
KEY_ID = "PXU75Z3V77"
APP_ID = "6770541682"
VERSION_ID = "87e7359a-c939-4e6c-be61-c35cb5930e2e"
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

    def req(self, method: str, path: str, body: dict | None = None) -> dict:
        data = json.dumps(body).encode() if body else None
        r = urllib.request.Request(
            f"https://api.appstoreconnect.apple.com{path}",
            data=data,
            headers=self.h,
            method=method,
        )
        try:
            with urllib.request.urlopen(r) as resp:
                raw = resp.read()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            return json.loads(e.read())


def main() -> None:
    api = ASC()

    # List IAP v2 (may be empty for subscription-only apps)
    iap = api.req("GET", f"/v1/apps/{APP_ID}/inAppPurchasesV2?limit=20")
    print("inAppPurchasesV2:", json.dumps(iap, indent=2)[:800])

    # Create review submission
    subm = api.req(
        "POST",
        "/v1/reviewSubmissions",
        {
            "data": {
                "type": "reviewSubmissions",
                "attributes": {"platform": "IOS"},
                "relationships": {
                    "app": {"data": {"type": "apps", "id": APP_ID}}
                },
            }
        },
    )
    print("\nreviewSubmissions create:", json.dumps(subm, indent=2)[:1200])
    submission_id = subm.get("data", {}).get("id")
    if not submission_id:
        return

    # Add app version
    vitem = api.req(
        "POST",
        "/v1/reviewSubmissionItems",
        {
            "data": {
                "type": "reviewSubmissionItems",
                "relationships": {
                    "reviewSubmission": {
                        "data": {"type": "reviewSubmissions", "id": submission_id}
                    },
                    "appStoreVersion": {
                        "data": {"type": "appStoreVersions", "id": VERSION_ID}
                    },
                },
            }
        },
    )
    print("\nadd version:", json.dumps(vitem, indent=2)[:800])

    # Try each relationship name for subscriptions
    for sid in SUBS:
        for rel_name, type_name in [
            ("inAppPurchases", "inAppPurchases"),
            ("subscriptions", "subscriptions"),
        ]:
            item = api.req(
                "POST",
                "/v1/reviewSubmissionItems",
                {
                    "data": {
                        "type": "reviewSubmissionItems",
                        "relationships": {
                            "reviewSubmission": {
                                "data": {"type": "reviewSubmissions", "id": submission_id}
                            },
                            rel_name: {"data": {"type": type_name, "id": sid}},
                        },
                    }
                },
            )
            err = item.get("errors", [{}])[0].get("code") if item.get("errors") else "OK"
            print(f"  add {rel_name} {sid}: {err}")

    # Submit
    final = api.req(
        "PATCH",
        f"/v1/reviewSubmissions/{submission_id}",
        {
            "data": {
                "type": "reviewSubmissions",
                "id": submission_id,
                "attributes": {"submitted": True},
            }
        },
    )
    print("\nPATCH submit:", json.dumps(final, indent=2)[:1500])


if __name__ == "__main__":
    main()

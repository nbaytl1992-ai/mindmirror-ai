#!/usr/bin/env python3
"""Check App Store Connect subscription metadata status."""
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

try:
    import jwt
except ImportError:
    print("pip install PyJWT cryptography", file=sys.stderr)
    sys.exit(1)

KEY_ID = "PXU75Z3V77"
ISSUER_ID = "0a48aa09-6990-4e92-8ae3-d90acc25e6bc"
APP_ID = "6770541682"
SUB_IDS = ["6770884039", "6770884810"]


def find_key() -> Path:
    candidates = [
        Path(__file__).resolve().parents[1] / "AuthKey_PXU75Z3V77.p8",
        Path.home() / "startup/mindmirror-ai/AuthKey_PXU75Z3V77.p8",
    ]
    for p in candidates:
        if p.exists():
            return p
    raise FileNotFoundError("AuthKey_PXU75Z3V77.p8 not found")


def make_token(key_path: Path) -> str:
    private_key = key_path.read_text()
    now = int(time.time())
    return jwt.encode(
        {"iss": ISSUER_ID, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
        private_key,
        algorithm="ES256",
        headers={"kid": KEY_ID, "typ": "JWT"},
    )


def api_get(token: str, path: str) -> dict:
    req = urllib.request.Request(
        f"https://api.appstoreconnect.apple.com{path}",
        headers={"Authorization": f"Bearer {token}"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"HTTP {e.code} {path}\n{body}") from e


def main() -> None:
    token = make_token(find_key())

    groups = api_get(
        token,
        f"/v1/apps/{APP_ID}/subscriptionGroups?include=subscriptions&limit=10",
    )
    print("=== Subscription Groups ===")
    print(json.dumps(groups, indent=2)[:6000])

    for sub_id in SUB_IDS:
        print(f"\n=== Subscription {sub_id} ===")
        sub = api_get(token, f"/v1/subscriptions/{sub_id}")
        print(json.dumps(sub, indent=2)[:4000])
        locs = api_get(token, f"/v1/subscriptions/{sub_id}/subscriptionLocalizations")
        print("Localizations:", json.dumps(locs, indent=2)[:2000])


if __name__ == "__main__":
    main()

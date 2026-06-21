#!/usr/bin/env python3
import json, time, urllib.request
from pathlib import Path
import jwt

KEY_ID, ISSUER = "PXU75Z3V77", "0a48aa09-6990-4e92-8ae3-d90acc25e6bc"
APP = "6770541682"
SUBS = ["6770884039", "6770884810"]

key = (Path.home() / "startup/mindmirror-ai/AuthKey_PXU75Z3V77.p8").read_text()
now = int(time.time())
token = jwt.encode({"iss": ISSUER, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"}, key, algorithm="ES256", headers={"kid": KEY_ID, "typ": "JWT"})
H = {"Authorization": f"Bearer {token}"}

def get(p):
    r = urllib.request.Request(f"https://api.appstoreconnect.apple.com{p}", headers=H)
    return json.loads(urllib.request.urlopen(r).read())

for sid in SUBS:
    print(f"\n=== {sid} prices with pricePoint ===")
    try:
        d = get(f"/v1/subscriptions/{sid}/prices?include=subscriptionPricePoint,territory&limit=5")
        print(json.dumps(d, indent=2)[:3500])
    except Exception as e:
        print(e)

print("\n=== App store versions (latest) ===")
try:
    v = get(f"/v1/apps/{APP}/appStoreVersions?filter[platform]=IOS&limit=5&sort=-createdDate")
    for item in v.get("data", []):
        print(item["id"], item["attributes"].get("versionString"), item["attributes"].get("appStoreState"))
except Exception as e:
    print(e)

print("\n=== In-app purchases v2 for app ===")
try:
    iap = get(f"/v1/apps/{APP}/inAppPurchasesV2?limit=10")
    print(json.dumps(iap, indent=2)[:3000])
except Exception as e:
    print(e)

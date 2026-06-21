#!/usr/bin/env python3
import json, time, urllib.request, urllib.error
from pathlib import Path
import jwt

key = (Path.home() / "startup/mindmirror-ai/AuthKey_PXU75Z3V77.p8").read_text()
now = int(time.time())
t = jwt.encode(
    {"iss": "0a48aa09-6990-4e92-8ae3-d90acc25e6bc", "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
    key,
    algorithm="ES256",
    headers={"kid": "PXU75Z3V77", "typ": "JWT"},
)
H = {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}
sub = "6770884810"
pp_base = "eyJzIjoiNjc3MDg4NDgxMCIsInQiOiJVU0EiLCJwIjoiMTAxNzcifQ"

# find ZWE equalization
r = urllib.request.Request(
    f"https://api.appstoreconnect.apple.com/v1/subscriptionPricePoints/{pp_base}/equalizations?limit=200",
    headers={"Authorization": f"Bearer {t}"},
)
eq = json.loads(urllib.request.urlopen(r).read())
zwe = None
for p in eq["data"]:
    if "WiI6IlpXRS" in p["id"] or p["id"].endswith("WiI6IlpXRSIsInAiOiIwIn0"):  # fragile
        pass
# decode: territory in base64 id often contains ZWE
for p in eq["data"]:
    if "ZWE" in p["id"]:
        zwe = p["id"]
        break
if not zwe:
  for p in eq["data"]:
    r2 = urllib.request.Request(
        f"https://api.appstoreconnect.apple.com/v1/subscriptionPricePoints/{p['id']}?include=territory",
      headers={"Authorization": f"Bearer {t}"},
    )
    d = json.loads(urllib.request.urlopen(r2).read())
    terr = d.get("included", [{}])[0].get("id") if d.get("included") else None
    if terr == "ZWE":
      zwe = p["id"]
      break

print("ZWE pp", zwe)
if zwe:
    body = json.dumps({
        "data": {
            "type": "subscriptionPrices",
            "relationships": {
                "subscription": {"data": {"type": "subscriptions", "id": sub}},
                "subscriptionPricePoint": {"data": {"type": "subscriptionPricePoints", "id": zwe}},
            },
        }
    }).encode()
    req = urllib.request.Request(
        "https://api.appstoreconnect.apple.com/v1/subscriptionPrices",
        data=body,
        headers=H,
        method="POST",
    )
    try:
        print(urllib.request.urlopen(req).read().decode()[:300])
    except urllib.error.HTTPError as e:
        print(e.read().decode()[:300])

r3 = urllib.request.Request(f"https://api.appstoreconnect.apple.com/v1/subscriptions/{sub}", headers={"Authorization": f"Bearer {t}"})
print("state", json.loads(urllib.request.urlopen(r3).read())["data"]["attributes"]["state"])

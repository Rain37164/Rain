#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从麦当劳官方 MCP 拉取站点所需的真实数据，生成静态 JSON。

用法:
    set MCD_MCP_TOKEN=xxx
    python fetch_data.py --city 南京市 --keyword 新街口 --out <站点data目录>

产出:
    nutrition.json  全量餐品营养（list-nutrition-foods，TOON 解析后）
    stores.json     附近门店（query-nearby-stores）
    menu.json       该门店在售菜单（query-meals）
所有数据均来自官方 MCP 实时返回，脚本不做任何硬编码或补全。
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request

URL = "https://mcp.mcd.cn"


def rpc(token: str, tool: str, args: dict) -> dict:
    payload = json.dumps(
        {"jsonrpc": "2.0", "id": 1, "method": "tools/call",
         "params": {"name": tool, "arguments": args}},
        ensure_ascii=False,
    ).encode("utf-8")
    req = urllib.request.Request(
        URL, data=payload, method="POST",
        headers={
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw, status = resp.read().decode("utf-8", "replace"), resp.status
    except urllib.error.HTTPError as e:
        raise SystemExit(f"[FAIL] {tool}: HTTP {e.code} {e.read().decode('utf-8','replace')[:200]}")

    body = "\n".join(
        l.strip()[5:].strip() for l in raw.splitlines() if l.strip().startswith("data:")
    ) or raw
    msg = json.loads(body)
    if "error" in msg:
        raise SystemExit(f"[FAIL] {tool}: {json.dumps(msg['error'], ensure_ascii=False)}")
    res = msg.get("result", {})
    if res.get("isError"):
        txt = "".join(c.get("text", "") for c in res.get("content", []))
        raise SystemExit(f"[FAIL] {tool}: {txt[:300]}")
    sc = res.get("structuredContent")
    if isinstance(sc, dict):
        return sc
    txt = "".join(c.get("text", "") for c in res.get("content", []))
    if "## Original Response" in txt:
        txt = txt.split("## Original Response", 1)[1].strip()
    return json.loads(txt)


def parse_toon(text: str) -> list[dict]:
    """解析 TOON 紧凑格式（列顺序以表头为准）。"""
    lines = [l for l in text.strip().split("\n") if l.strip()]
    head = lines[0]
    cols = head[head.find("{") + 1:head.find("}")].split(",")
    n = int(head[head.find("[") + 1:head.find("]")])
    num_cols = {"energyKj", "energyKcal", "protein", "fat", "carbohydrate", "sodium", "calcium"}
    rows = []
    for line in lines[1:1 + n]:
        vals = [v.strip() for v in line.strip().split(",")]
        vals = (vals + [""] * len(cols))[:len(cols)]
        row = dict(zip(cols, vals))
        for k in num_cols:
            v = row.get(k)
            row[k] = None if v in (None, "", "null") else float(v)
        row["nutritionDescription"] = None if row.get("nutritionDescription") in ("null", "") else row.get("nutritionDescription")
        rows.append(row)
    return rows


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--city", default="南京市")
    ap.add_argument("--keyword", default="新街口")
    ap.add_argument("--out", required=True)
    ap.add_argument("--token", default=os.environ.get("MCD_MCP_TOKEN", ""))
    a = ap.parse_args()
    if not a.token:
        print("[FAIL] 未提供 MCP Token（参数 --token 或环境变量 MCD_MCP_TOKEN）")
        return 2
    os.makedirs(a.out, exist_ok=True)

    # 1) 营养
    nut = rpc(a.token, "list-nutrition-foods", {})
    rows = parse_toon(nut["data"])
    json.dump(rows, open(os.path.join(a.out, "nutrition.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(f"[OK] nutrition.json  {len(rows)} 条")

    # 2) 门店（到店自取，按位置搜索）
    st = rpc(a.token, "query-nearby-stores",
             {"searchType": 2, "beType": 1, "city": a.city, "keyword": a.keyword})
    stores = st.get("data") or []
    json.dump(stores, open(os.path.join(a.out, "stores.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(f"[OK] stores.json     {len(stores)} 家  ({a.city} {a.keyword})")
    if not stores:
        print("[WARN] 未查到门店，跳过菜单抓取")
        return 1

    open_store = next((s for s in stores if s.get("businessStatus")), stores[0])
    store_code, be_code = open_store.get("storeCode"), open_store.get("beCode")
    print(f"     选用门店: {open_store.get('storeName')} ({store_code})")

    # 3) 菜单
    menu = rpc(a.token, "query-meals",
               {"storeCode": store_code, "beCode": be_code, "orderType": 1, "beType": 1})
    payload = {"store": open_store, "storeCode": store_code, "beCode": be_code,
               "orderType": 1, "beType": 1, "datetime": menu.get("datetime"),
               "data": menu.get("data")}
    json.dump(payload, open(os.path.join(a.out, "menu.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    meals = (menu.get("data") or {}).get("meals") or {}
    cats = (menu.get("data") or {}).get("categories") or []
    print(f"[OK] menu.json       {len(meals)} 个餐品 / {len(cats)} 个分类")
    return 0


if __name__ == "__main__":
    sys.exit(main())

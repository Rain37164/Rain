#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
抓取门店在售餐品的 query-meal-detail（套餐组成 / 可特制项），用于详情页。

用法:
    set MCD_MCP_TOKEN=xxx
    python fetch_details.py --data <站点data目录>

读取 data/menu.json 与 data/nutrition.json，只抓「菜单 ∩ 营养表」命中的餐品，
避免无意义请求。产出 data/details.json 与 assets/js/details-embed.js。
"""
import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor

URL = "https://mcp.mcd.cn"
ALIAS = {"薯条": "中薯条", "麦乐鸡": "麦乐鸡5块", "麦辣鸡翅": "麦辣鸡翅-2块"}
SPEC_WORDS = ["中杯", "大杯", "小杯", "盒装", "瓶装", "冰", "热"]
COMBO_WORDS = ["套餐", "三件套", "四件套", "随心选", "随心配", "分享餐", "任选", "拼盘", "双人", "多人", "双堡", "组合"]


def is_combo(name):
    return any(w in name for w in COMBO_WORDS)


def strip_spec(s):
    changed = True
    while changed:
        changed = False
        for w in SPEC_WORDS:
            if len(s) > len(w) and s.startswith(w):
                s = s[len(w):]; changed = True; break
            if len(s) > len(w) and s.endswith(w):
                s = s[:-len(w)]; changed = True; break
    return s


def norm(s):
    s = re.sub(r"[\s\u3000]", "", str(s or ""))
    s = s.replace("（", "(").replace("）", ")").replace("·", "").replace("・", "").replace("™", "")
    return s.lower()


def rpc(token, tool, args):
    payload = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                          "params": {"name": tool, "arguments": args}}, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(URL, data=payload, method="POST", headers={
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"})
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = r.read().decode("utf-8", "replace")
    body = "\n".join(l.strip()[5:].strip() for l in raw.splitlines() if l.strip().startswith("data:")) or raw
    msg = json.loads(body)
    res = msg.get("result", {})
    if res.get("isError"):
        raise RuntimeError("".join(c.get("text", "") for c in res.get("content", []))[:200])
    sc = res.get("structuredContent")
    if isinstance(sc, dict):
        return sc
    txt = "".join(c.get("text", "") for c in res.get("content", []))
    if "## Original Response" in txt:
        txt = txt.split("## Original Response", 1)[1].strip()
    return json.loads(txt)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--token", default=os.environ.get("MCD_MCP_TOKEN", ""))
    ap.add_argument("--workers", type=int, default=4)
    a = ap.parse_args()
    if not a.token:
        print("[FAIL] 未提供 Token")
        return 2

    menu = json.load(open(os.path.join(a.data, "menu.json"), encoding="utf-8"))
    nut = json.load(open(os.path.join(a.data, "nutrition.json"), encoding="utf-8"))
    meals = menu["data"]["meals"]
    store_code = menu["storeCode"]
    be_code = menu.get("beCode")

    exact = {r["productName"]: r for r in nut if r.get("productName")}
    nrm = {norm(k): v for k, v in exact.items()}
    nstrip = {}
    for k, v in exact.items():
        s = strip_spec(norm(k))
        nstrip.setdefault(s, v)

    def matched(name):
        if name in exact:
            return True
        n = norm(name)
        if n in nrm:
            return True
        if is_combo(name):
            return False
        if name in ALIAS and ALIAS[name] in exact:
            return True
        return strip_spec(n) in nstrip

    targets = [(c, m["name"]) for c, m in meals.items() if matched(m["name"])]
    print(f"[INFO] 命中有营养数据的餐品 {len(targets)} 个，开始抓取详情…")

    def fetch(pair):
        code, name = pair
        args = {"code": code, "storeCode": store_code, "orderType": 1, "beType": 1}
        if be_code:
            args["beCode"] = be_code
        try:
            return code, rpc(a.token, "query-meal-detail", args), None
        except Exception as e:  # noqa: BLE001
            return code, None, str(e)

    out, fails = {}, []
    with ThreadPoolExecutor(max_workers=a.workers) as ex:
        for code, res, err in ex.map(fetch, targets):
            if err:
                fails.append((code, err))
            else:
                out[code] = res

    json.dump(out, open(os.path.join(a.data, "details.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    js_dir = os.path.join(os.path.dirname(a.data.rstrip("/\\")), "assets", "js")
    os.makedirs(js_dir, exist_ok=True)
    open(os.path.join(js_dir, "details-embed.js"), "w", encoding="utf-8").write(
        "/* query-meal-detail 快照，生成于 fetch_details.py */\nwindow.MCD_DETAILS = "
        + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n")
    print(f"[OK] 成功 {len(out)} / 失败 {len(fails)}")
    for c, e in fails[:8]:
        print("   !", c, e[:110])
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
麦当劳 MCP 工具直连调用（兜底通道）

当 WorkBuddy 的 MCP 连接器尚未启用/未被信任时，可通过本脚本直连官方 MCP 执行 tools/call。
只读类工具可放心使用；领券(auto-bind-coupons)、下单(create-order)、抽奖(draw-lottery)
等会产生真实副作用，必须经用户明确确认后再调用。

用法:
    python call.py now-time-info
    python call.py query-nearby-stores '{"searchType":2,"beType":1,"city":"南京市","keyword":"新街口"}'
    python call.py query-meals '{"storeCode":"xxx","beCode":"xxx","orderType":1,"beType":1}'

Token 从环境变量 MCD_MCP_TOKEN 读取，或第二个位置参数传入。
"""
import json
import os
import sys
import urllib.error
import urllib.request

URL = "https://mcp.mcd.cn"
WRITE_TOOLS = {
    "create-order", "cancel-order", "auto-bind-coupons", "draw-lottery",
    "mall-create-order", "party-order-create", "delivery-create-address",
}


def rpc(token: str, method: str, params: dict) -> dict:
    payload = json.dumps(
        {"jsonrpc": "2.0", "id": 1, "method": method, "params": params},
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
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw, status = resp.read().decode("utf-8", "replace"), resp.status
    except urllib.error.HTTPError as e:
        raw, status = e.read().decode("utf-8", "replace"), e.code

    if status == 401:
        return {"_error": "401 MCP Token 无效或已过期，请重新配置有效的 MCP Token"}
    if status == 429:
        return {"_error": "429 当前请求频次过高，已触发限流（600次/分钟），请稍后重试"}
    if status != 200:
        return {"_error": f"HTTP {status}: {raw[:300]}"}

    for line in raw.splitlines():
        if line.strip().startswith("data:"):
            try:
                return json.loads(line.strip()[5:].strip())
            except json.JSONDecodeError:
                continue
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"_error": "响应解析失败", "_raw": raw[:300]}


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    tool = sys.argv[1]
    args = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    token = sys.argv[3] if len(sys.argv) > 3 else os.environ.get("MCD_MCP_TOKEN", "")
    if not token:
        print("[FAIL] 未提供 MCP Token（环境变量 MCD_MCP_TOKEN 或第三个参数）")
        return 2

    msg = rpc(token, "tools/call", {"name": tool, "arguments": args})
    if "_error" in msg:
        print("[FAIL]", msg["_error"])
        return 1
    if "error" in msg:
        print("[FAIL]", json.dumps(msg["error"], ensure_ascii=False))
        return 1

    content = msg.get("result", {}).get("content", [])
    for c in content:
        if c.get("type") == "text":
            text = c["text"]
            try:
                print(json.dumps(json.loads(text), ensure_ascii=False, indent=2))
            except json.JSONDecodeError:
                print(text)
        else:
            print(json.dumps(c, ensure_ascii=False)[:2000])
    if tool in WRITE_TOOLS:
        print("\n[注意] 该工具已产生真实业务副作用。")
    return 0


if __name__ == "__main__":
    sys.exit(main())

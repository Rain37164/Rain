#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
麦当劳官方 MCP 连通性自检（仅读，不下单、不领券）

用法:
    python probe.py                    # 从环境变量 MCD_MCP_TOKEN 读取
    python probe.py <YOUR_MCP_TOKEN>   # 直接传入

仅调用 MCP 标准方法 tools/list，验证：
  1. Token 是否有效（401 会明确提示）
  2. 服务端是否可达、是否触发限流（429）
  3. 返回了哪些工具，5 个核心点餐工具是否齐全
"""
import json
import os
import sys
import urllib.error
import urllib.request

URL = "https://mcp.mcd.cn"
CORE_TOOLS = [
    "query-nearby-stores",
    "query-meals",
    "query-store-coupons",
    "calculate-price",
    "list-nutrition-foods",
]


def call(token: str, method: str, params: dict | None = None) -> tuple[int, str]:
    payload = json.dumps(
        {"jsonrpc": "2.0", "id": 1, "method": method, "params": params or {}},
        ensure_ascii=False,
    ).encode("utf-8")
    req = urllib.request.Request(
        URL,
        data=payload,
        method="POST",
        headers={
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            return resp.status, resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")


def parse_sse_or_json(raw: str):
    """Streamable HTTP 可能返回 SSE（data: ...）或直接 JSON。"""
    for line in raw.splitlines():
        line = line.strip()
        if line.startswith("data:"):
            try:
                return json.loads(line[5:].strip())
            except json.JSONDecodeError:
                continue
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def main() -> int:
    token = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("MCD_MCP_TOKEN", "")
    if not token:
        print("[FAIL] 未提供 MCP Token。")
        print("       用法: python probe.py <TOKEN>  或先 export MCD_MCP_TOKEN=<TOKEN>")
        print("       获取方式: open.mcd.cn 手机号登录 -> 控制台 -> 激活")
        return 2

    status, raw = call(token, "tools/list")
    if status == 401:
        print("[FAIL] 401 MCP Token 无效或已过期，请重新配置有效的 MCP Token")
        return 1
    if status == 429:
        print("[FAIL] 429 触发限流（超过 600 次/分钟），请稍后重试")
        return 1
    if status != 200:
        print(f"[FAIL] HTTP {status}: {raw[:300]}")
        return 1

    msg = parse_sse_or_json(raw)
    if not msg or "result" not in msg:
        print(f"[FAIL] 响应解析失败: {raw[:300]}")
        return 1

    tools = msg["result"].get("tools", [])
    names = [t.get("name", "") for t in tools]
    print(f"[OK] MCP 连接成功，共 {len(names)} 个工具")

    missing = [t for t in CORE_TOOLS if t not in names]
    if missing:
        print(f"[WARN] 缺少核心工具: {', '.join(missing)}")
    else:
        print("[OK] 5 个核心点餐工具齐全（门店/菜单/券/算价/营养）")

    print("\n工具清单:")
    for n in names:
        mark = " *" if n in CORE_TOOLS else ""
        print(f"  - {n}{mark}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

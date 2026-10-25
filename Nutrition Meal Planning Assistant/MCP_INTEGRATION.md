# MCP 接入说明

本文档说明 Nutrition Meal Planning Assistant 如何接入**麦当劳中国官方 MCP Server**。站点所有餐品、价格、门店、营养数据均通过该接口获取。

---

## 1. 申请 MCP Token

1. 访问 [open.mcd.cn](https://open.mcd.cn)，点击右上角「登录」，使用手机号验证码登录。
2. 登录成功后，右上角「登录」变为「控制台」，点击进入。
3. 点击「激活」申请 MCP Token，同意服务协议后即可一键复制。

> Token 属于个人凭证，**不要提交到任何公开仓库**。仓库中的 `mcp-config.example.json` 已使用占位符。

---

## 2. 接入配置

- **服务器地址**：`https://mcp.mcd.cn`（**根路径**，`/mcp` 会返回 404）
- **协议**：Streamable HTTP（MCP 2025-06-18）
- **鉴权**：请求头 `Authorization: Bearer <TOKEN>`
- **限流**：600 次 / 分钟

```json
{
  "mcpServers": {
    "mcd-mcp": {
      "type": "streamablehttp",
      "url": "https://mcp.mcd.cn",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_TOKEN"
      }
    }
  }
}
```

完整示例见 [mcp-config.example.json](./mcp-config.example.json)。

在 WorkBuddy 中：写入 `~/.workbuddy/mcp.json` 后，需在**连接器管理页**对新出现的自定义服务点「信任」，工具才会出现在工具列表。

### 错误码

| 状态码 | 含义 | 处理 |
| --- | --- | --- |
| 401 | Token 无效或过期 | 提示用户重新申请 Token，不重试 |
| 429 | 触发限流（600 次 / 分钟） | 稍后重试，降低调用频率 |

---

## 3. 工具清单

`tools/list` 实际返回 **35 个工具**（官方文档列出 33 个，另有 `query-promotions`、`query-survey-coupon` 未文档化）。完整入参出参见 [`mcp/references/mcp-tools.md`](./mcp/references/mcp-tools.md)。

本项目使用的核心工具：

| 工具 | 用途 |
| --- | --- |
| `now-time-info` | 获取服务器时间，确定在售时段 |
| `query-nearby-stores` | 查询附近门店（`storeCode`、营业状态、距离） |
| `query-meals` | 查询门店在售菜单与价格（15 个分类 / 116 款） |
| `list-nutrition-foods` | 全量营养数据（160 条，TOON 格式） |
| `query-meal-detail` | 套餐组成与可特制项（33 款） |
| `query-store-coupons` | 门店可用优惠券 |
| `calculate-price` | 官方算价复核 |

> 注意：官方工具名写作 `query-party-store-date` / `query-party-store-session`，而 `tools/list` 实际返回 `query-partystore-date` / `query-party-store-session`——**以实际返回为准**。

---

## 4. 配餐调用流水线

```
now-time-info        确定在售时段
      ↓
query-nearby-stores  取门店列表与 storeCode
      ↓
query-meals          取在售菜单 + 价格
      ↓
list-nutrition-foods 取全量营养（TOON）
      ↓
名称对齐 + 组合求解  （严格 ±100 kcal）
      ↓
query-store-coupons  取门店优惠券
      ↓
calculate-price      官方算价复核
```

详细流水线、字段陷阱与算法见 [`mcp/references/ordering-pipeline.md`](./mcp/references/ordering-pipeline.md)。

---

## 5. 字段陷阱（实测）

| 坑 | 说明 | 后果 |
| --- | --- | --- |
| `code` vs `productCode` | 菜单返回字段名为 `code`，算价 / 下单必须改名为 `productCode` | 传错**不报错**，静默返回 `price: 0` |
| 金额单位 | 菜单 `currentPrice` 是**元**，`calculate-price` 返回是**分** | 直接相加会差 100 倍 |
| `takeWayCode` | 到店自取 / 麦乐送需传，取自算价返回的 `takeWayList` | 缺失则下单失败 |
| TOON 解析 | `tools/call` 优先取 `result.structuredContent`；`content[0].text` 是「字段说明 + ## Original Response + JSON」包装文本，需切分 | 直接 `JSON.parse(text)` 会失败 |
| 营养表只有单品 | 套餐类餐品在营养表中没有对应记录 | 近似匹配会**严重低估**套餐热量 |
| `query-promotions` | 仅限企业团餐 `beType=6` | 个人点餐调用无结果 |

---

## 6. 取数脚本

```bash
export MCD_MCP_TOKEN="<你的 Token>"

python mcp/scripts/probe.py          # 连通性自检（tools/list），无 token 退出码 2
python mcp/scripts/fetch_data.py     # 营养 + 门店 + 菜单 → site/data/*.json
python mcp/scripts/fetch_details.py  # query-meal-detail → site/data/details.json
python mcp/scripts/call.py           # 直连兜底通道（tools/call）
```

`call.py` 将 `create-order` / `cancel-order` / `auto-bind-coupons` / `draw-lottery` / `mall-create-order` / `party-order-create` / `delivery-create-address` 列为 **WRITE_TOOLS**，调用前会提示副作用，避免误下单。

---

## 7. 数据安全

- Token 仅通过环境变量 `MCD_MCP_TOKEN` 传入，不写入源码、不进入版本库。
- 站点把接口快照内联为 `site/assets/js/data-embed.js`，运行时**不再请求网络**，因此 `file://` 直接打开也能完整运行。
- 快照为 2026-10-15 的官方数据；如需最新数据请重跑取数脚本。
- 本项目只使用**只读**工具，`create-order` 等写操作未在站点中调用。

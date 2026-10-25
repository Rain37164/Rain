# 点餐流水线与工程细节

## 1. 标准流水线（到店场景）

```
now-time-info            → 确认当前时段（决定早餐/午餐菜单）
query-nearby-stores      → searchType=2 (city+keyword) / 3(经纬度)，beType=1
                           取 storeCode + beCode（后续所有调用都要带）
query-store-coupons      → storeCode + beCode + orderType=1 + beType=1
                           记录 couponId / couponCode / products(适用商品)
query-meals              → 同上参数；拿 categories + meals(code, name, currentPrice)
query-meal-detail        → 需要换配菜/特制时，取 modification / rounds
calculate-price          → items[].productCode ← meals[].code（注意改名！）
                           带 couponId + couponCode + withOrder
create-order             → takeWayCode 取自算价返回的 takeWayList（必须）
```

外送场景替换：`delivery-query-addresses` → `delivery-query-stores(addressId, beType=2)` → `orderType=2, beType=2`，下单需 `addressId` 与 `remark`。

## 2. 三个会静默出错的陷阱

### 陷阱 A：`code` ≠ `productCode`
- `query-meals` 返回：`{ "meals": { "9900008139": { "name": "...", "currentPrice": "14" } } }`，键名就是 `code`。
- `calculate-price` 的 `items[]` 只认 `productCode`。
- **传错不报错，直接返回 `price: 0`。** 每次算价前逐项核对，若返回 0 立即检查该字段。

### 陷阱 B：单位不一致
| 来源 | 单位 | 例 |
| --- | --- | --- |
| `query-meals.currentPrice` / `originalPrice` | 元（字符串） | `"25.5"` |
| `query-meal-detail.price` | 元 | `"26"` |
| `calculate-price.*` | **分（整数）** | `2200` = ¥22.00 |
| `calculate-price.tablewarePrice` | 分 | `10` = ¥0.10 |
| `order-list.realTotalAmount` | 元（字符串） | `"40"` |

展示给用户前统一转元：`元 = 分 / 100`。

### 陷阱 C：券的适用范围
`query-store-coupons` 返回的每张券带 `products[]`，只有列表内的 `productCode` 才能用这张券。跨商品用券会导致优惠不生效——算价后务必核对 `discount` 是否 > 0。

## 3. 营养数据（TOON）解析

`list-nutrition-foods` 无入参，一次返回全量，格式为 TOON：

```
[N]{productName,nutritionDescription,energyKj,energyKcal,protein,fat,carbohydrate,sodium,calcium}:
  猪柳麦满分,null,1288,308,16,16,24,781,213
  吉士蛋麦满分,null,1100,263,14,12,22,650,180
```

解析要点：
1. 第一行 `[N]{...}` 给出行数与列顺序，**列顺序以它为准，不要写死**。
2. 后续每行按逗号切分，`null` 视为 0 或缺失。
3. 商品名可能含逗号风险较低，但建议按列数从右侧对齐校验。

参考实现：
```python
def parse_toon(text: str) -> list[dict]:
    lines = [l for l in text.strip().split("\n") if l.strip()]
    header = lines[0]
    cols = header[header.find("{")+1:header.find("}")].split(",")
    n = int(header[header.find("[")+1:header.find("]")])
    out = []
    for line in lines[1:1+n]:
        vals = [v.strip() for v in line.strip().split(",")]
        row = dict(zip(cols, vals))
        for k in ("energyKj","energyKcal","protein","fat","carbohydrate","sodium","calcium"):
            row[k] = 0 if row.get(k) in (None, "null", "") else float(row[k])
        out.append(row)
    return out
```

## 4. 配餐求解：营养表 × 菜单对齐

`list-nutrition-foods` 只有 `productName`，没有 `code`。因此：

1. 用 `productName` 与 `query-meals.meals[].name` 做匹配（去空格、全半角归一化后精确匹配）。
2. **只有匹配上的商品才能进入方案**——否则无法算价、无法下单。
3. 匹配不上的营养条目只作参考，明确标注「当前门店菜单未检索到该餐品」。

热量组合（目标 T，容差 ±100kcal）：
- 单品枚举 + 双品组合暴力搜索即可（菜单规模百级，组合量万级，可接受）。
- 目标函数：`abs(sum(kcal) - T)` 最小；同分时优先蛋白质高（增肌）或脂肪低（减脂）。
- 输出时给出实际总热量与目标差值，不允许虚构凑数。

## 5. 省钱组合：券的枚举

1. 券集合 C（来自 `query-store-coupons` + `query-my-coupons`）。
2. 每个券的适用商品集合 P(c) = `products[].productCode`。
3. 对用户想吃的目标商品，枚举「用哪张券」与「是否凑单加一件满足门槛」。
4. **每一组候选都必须真的调 `calculate-price`**，用接口返回的 `price` 排序，禁止自己按面额估算。
5. 输出：原价（`originalPrice`）、优惠（`discount`）、应付（`price`）、节省额，均换算为元。

## 6. 随单购（麦金卡/早餐卡）

`query-meals` 中 `isCanWithOrder: true` 且带 `withOrder{membershipCode, specId, ...}` 的商品，若用户想享受随单购优惠，需把 `withOrder` 原样带入 `calculate-price` 和 `create-order`，否则优惠不生效。

## 7. 下单前必做的三件事

1. `calculate-price` 校验金额（返回 0 就回头查 `productCode`）。
2. 到店场景从 `takeWayList` 取 `takeWayCode`；外送场景准备 `addressId`。
3. 向用户复述「门店 + 商品 + 数量 + 券 + 应付金额」，得到明确确认后再调 `create-order`。

## 8. 调用频率控制

限流 600 次/分钟。批量试算价格时合并候选、避免逐券重复调用；遇到 429 立即降频并告知用户。

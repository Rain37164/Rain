# 麦当劳官方 MCP 接口速查（v1.0.8）

来源：https://open.mcd.cn/mcp/doc（官方文档）
接入地址：`https://mcp.mcd.cn` ｜ 协议：Streamable HTTP ｜ 鉴权：`Authorization: Bearer <TOKEN>` ｜ 限流：600 次/分钟

通用响应外壳：
```json
{ "success": true, "code": 200, "message": "请求成功", "datetime": "...", "traceId": "...", "data": {} }
```

## 枚举字典（多处复用）

| 字段 | 取值 |
| --- | --- |
| `orderType` | 1=到店，2=外送 |
| `beType` | 1=到店取餐，2=麦乐送到家，5=得来速(DT)，6=企业团餐 |
| `searchType` | 1=搜索收藏餐厅（默认），2=按位置搜索，3=按经纬度搜索 |
| `cancelReasonCode` | 1=改主意了，2=重复下单，3=点错/点多/点少，4=地址/电话填错，5=送达时间选错，-1=其它 |

---

## 一、通用

### now-time-info — 当前时间信息
- 入参：无
- 出参：`timestamp` / `datetime` / `formatted` / `date` / `year` / `month` / `day` / `dayOfWeek` / `timezone` / `offset` / `utc`
- 用途：确定当前时段（早餐/午餐/下午茶/夜市）或查询活动日历前先取时间

---

## 二、门店与地址

### query-nearby-stores — 查询附近可用门店（到店/得来速场景）
入参：

| name | 说明 |
| --- | --- |
| searchType | 必填，1/2/3，默认 1 |
| beType | 必填，1=到店自取，5=得来速车道取餐（**仅支持这两种**） |
| city | 仅 searchType=2 时必填 |
| keyword | 位置关键词，仅 searchType=2 时必填 |
| longitude / latitude | 仅 searchType=3 时必填 |

出参（数组）：`storeCode`、`beCode`、`storeName`、`address`、`distance`、`reservation`、`reservationTimeOptions[{date,today,reservationOptionText}]`、`businessStatus`、`businessStartTime`、`businessEndTime`

> 调用前需确认用户是「到店取餐」还是「得来速车道取餐」。

### delivery-query-addresses — 可配送地址列表
- 入参：无
- 出参：`addresses[{addressId, contactName, phone, fullAddress}]`

### delivery-create-address — 新增配送地址
| name | 说明 |
| --- | --- |
| city | 必填，实际城市名，如"南京市" |
| contactName | 必填，如"李明" |
| gender | 选填，"先生"/"女士" |
| phone | 必填，11 位纯数字 |
| address | 必填，如"清竹园9号楼" |
| addressDetail | 必填，门牌号，如"2单元508" |

### delivery-query-stores — 查询可配送门店（外送/团餐）
| name | 说明 |
| --- | --- |
| addressId | 必填 |
| beType | 必填，2=麦乐送，6=企业团餐 |

出参同 nearby-stores（含 `reservationTimeOptions` 预约时段）。

### query-meal-assistance — 查询助餐服务（仅企业团餐）
入参：`storeCode`、`beCode`、`beType`（仅 6）、`orderType`（仅 2）、`reservationDate`（选填，`yyyy-MM-dd HH:mm`）
出参：`mealAssistanceItems[{gmServiceCode, gmServiceName, serviceItems[], selected, enable}]`、`promotions[]`（满减折扣文案）

---

## 三、菜单与营养

### query-meals — 当前可售餐品列表
入参：`storeCode`（必填）、`beCode`、`orderType`（必填）、`beType`（必填）、`reservationDate`（预约场景必填）

出参：
```json
{
  "frequent": [{ "code": "9900008139", "tags": [] }],
  "categories": [{ "name": "人气热卖", "daypart": 8, "meals": [{ "code": "...", "tags": ["第二份半价"] }] }],
  "meals": {
    "920215": {
      "name": "培根安格斯厚牛堡大套餐",
      "currentPrice": "55.5",
      "originalPrice": "65.5",
      "image": "xxxx.jpeg",
      "discountType": "随单购麦金卡优惠",
      "isCanWithOrder": true,
      "withOrder": { "cardId": "", "cardType": "", "membershipCode": "106", "specId": "xxx" }
    }
  }
}
```
- `discountType` 取值：`null`=不享受优惠 / 早餐卡优惠 / 促销优惠 / 麦金卡优惠 / 随单购早餐卡优惠 / 随单购麦金卡优惠
- `withOrder`：用户选择随单购时，需原样带入 `calculate-price` 与 `create-order`
- **价格单位为元（字符串）**

### query-meal-detail — 餐品详情
入参：`code`（餐品编码，必填）、`storeCode`（必填）、`beCode`、`orderType`、`beType`、`reservationDate`
出参：`code`、`name`、`price`、`image`、`rounds[]`、`modification.items[{maxValues,minValues,values[{code,price,name,maxQuantity,minQuantity,selectedQuantity,selectedKey,unselectedKey}]}]`、`supportModify`
- v1.0.5 起支持更换套餐内商品组合与部分餐品特制

### list-nutrition-foods — 餐品营养信息列表
- 入参：**无需入参**
- 出参为 **TOON（Token-Oriented Object Notation）紧凑格式**，非 JSON 数组：
```
[1]{productName,nutritionDescription,energyKj,energyKcal,protein,fat,carbohydrate,sodium,calcium}:
  猪柳麦满分,null,1288,308,16,16,24,781,213
```
- 字段：能量(kJ)、能量(kcal)、蛋白质(g)、脂肪(g)、碳水化合物(g)、钠(mg)、钙(mg)
- 解析方式见 `ordering-pipeline.md`

---

## 四、优惠券与活动

### query-store-coupons — 门店可用优惠券
入参：`storeCode`（必填）、`beCode`、`orderType`（必填）、`beType`（必填）、`reservationDate`（预约必填）
出参：
```json
[{ "title": "外送优惠券二次券", "couponId": "...", "couponCode": "...",
   "tradeDateTime": "2025-04-21 23:23:00-2026-07-01 23:59:59",
   "products": [{ "productCode": "...", "productName": "甜蜜小食1+1" }] }]
```
> `products` 限定该券适用商品；算价时 `couponId` + `couponCode` 一起传入 `items`。

### available-coupons — 麦麦省可领券列表
- 入参：无。返回 Markdown 列表（标题 / 状态：已领取·未领取·不可领取 / 图片）

### auto-bind-coupons — 麦麦省一键领券
- 入参：无，自动领取所有可领券
- 出参：总计/成功/失败数 + 成功券的 `couponId`、`couponCode`
- ⚠️ 会真实写入用户账户，**必须先征得用户确认**

### query-my-coupons — 我的优惠券
- 入参：无。返回 Markdown（优惠内容、有效期、领取时间、标签：到店专用/外送专用）

### campaign-calendar — 活动日历
- 入参：无（可配合 `now-time-info` 指定日期）。返回当月进行中/往期/未来活动

---

## 五、交易

### calculate-price — 商品价格计算
入参：

| name | 说明 |
| --- | --- |
| storeCode | 必填 |
| beCode | BE 编码 |
| orderType | 必填 |
| beType | 必填 |
| reservationDate | 预约场景必填，`yyyy-MM-dd HH:mm` |
| gmServiceCode | 团餐助餐服务 code |
| withOrder | 随单购商品（取自菜单 `withOrder`） |
| needTableware | 是否需要餐具 |
| items | 商品列表数组 |

`items[]`：`productCode`（必填）、`quantity`（必填）、`couponId`、`couponCode`、`modification`、`roundList`
`modification.values[]`：`code`、`quantity`、`key`
`roundList[]`：`round`、`comboItemList[]`，`comboItemList[]`：`code`、`quantity`、`modification`

出参（**单位：分**）：
```json
{ "productOriginalPrice": 1600, "productPrice": 1600,
  "deliveryOriginalPrice": 600, "deliveryPrice": 600,
  "originalPrice": 2200, "discount": 0, "price": 2200,
  "productList": [{ "productCode": "...", "productName": "...", "quantity": 1, "originalSubtotal": 1600, "subtotal": 1600 }],
  "takeWayList": [], "mealAssistanceList": [], "tablewarePrice": 10 }
```
- `takeWayList`：到店场景可选取餐方式 → `create-order` 需要其中的 `takeWayCode`

### create-order — 创建订单
入参：`storeCode`、`beCode`、`addressId`（外送必填）、`takeWayCode`（到店必填，取自算价 `takeWayList`）、`beType`、`reservationDate`、`gmServiceCode`、`withOrder`、`needTableware`、`remark`（选填，≤50 字，仅外送）、`items`（结构同算价）
出参：`orderId`、`payId`、`payH5Url`（支付链接）、`orderDetail{orderStatus, storeName, storeAddress, orderProductList[], totalAmount, realTotalAmount, totalDiscountAmount, couponList, deliveryInfo, takeWay, pickupCode, lockerCode, lockerQrCode, mealAssistance}`

### cancel-order — 取消订单
入参：`orderId`（必填）、`cancelReasonCode`（必填，见枚举）
出参：`{ cancelResult: true, orderId }`

### query-order — 订单详情
入参：`orderId`。出参同 `create-order.orderDetail`，另含 `productImage`

### order-list — 历史订单
入参：无。最多返回最近 10 笔到店/外送订单（商城订单用 `mall-order-list`）
出参：`list[{orderId, orderType, createTime, beType, beCode, storeCode, storeName, orderStatus, orderProductList[{productCode, productName, quantity, comboItemList[]}], realTotalAmount}]`

---

## 六、积分、商城与抽奖

| 工具 | 入参 | 要点 |
| --- | --- | --- |
| `query-my-account` | 无 | `availablePoint`、`accumulativePoint`、`frozenPoint`、`usedPoint`、`nextMouthExpirePoint` 等 |
| `mall-points-products` | `catRuleIds`（选填，逗号分隔） | 类目：商品券 `1>4`、实物 `2`、周边 `2>8`、实物礼品卡 `2>9`、生日派对 `1>6>20`、主题派对 `1>6>21`、麦麦体验营 `1>6>22`、品鉴会 `1>6>25`、读书会 `1>6>34`、积分兑换活动 `1>6>40` |
| `mall-product-detail` | `spuId`（Long，必填） | 返回 `skuList[{skuId, points, extTradePrice, specList[]}]`、`upDate`/`downDate` |
| `mall-create-order` | 商城下单 | 返回兑换订单号与券码 |
| `mall-order-list` / `mall-order-detail` | 近一年商城订单 | — |
| `query-lottery-info` | 无 | `activityStatusText`、`drawPoint`、`availableTimes`、`availablePoint`、`drawDecision`、`prizes[]` |
| `draw-lottery` | 无 | ⚠️ 1 秒内不可重复调用；返回 `win`、`prizes`、`consumePoint`、`remainPoint`、`remainChance` |
| `query-my-prizes` | `pageNum`（默认1）、`pageSize`（默认10，最大20） | 按中奖时间倒序，含 `couponInfo{couponCode, couponId}` |

---

## 七、主题活动（派对/品鉴会）

流水线：`mall-points-products`（拿主题类 spuId）→ `query-party-city(spuId)` → `query-party-store(spuId, code[, latitude, longitude])` → `query-partystore-date(spuId, storeCode)` → `query-partystore-session(spuId, storeCode, dateStr)` → `party-order-create`

`party-order-create` 入参：`spuId`、`skuId`、`storeCode`、`dateStr`、`code`（城市 code）、`partyType`、`id`（场次 ID）、`timeStart`、`timeEnd`、`leftNum`、`count`
出参：`orderId`、`amount`、`payH5Url`、`goods[]`

---

## 八、错误码

| code | 原因 | 处理 |
| --- | --- | --- |
| 401 | Token 无效/过期/未提供 | 检查 Authorization 请求头与 Token |
| 429 | 超过 600 次/分钟 | 降低频率 |

## 九、版本日志（官方）

| 日期 | 版本 | 内容 |
| --- | --- | --- |
| 2025-12-09 | 1.0.0 | 麦麦日历和麦麦省领券 |
| 2026-01-23 | 1.0.1 | 增加餐品营养信息列表；缩短 URL |
| 2026-02-13 | 1.0.2 | 麦乐送点餐与积分兑换券 |
| 2026-04-02 | 1.0.3 | 到店取餐与团餐 |
| 2026-05-21 | 1.0.4 | 积分兑换实物、商城订单查询、得来速下单、全场景预约 |
| 2026-06-16 | 1.0.5 | 更换套餐内商品组合、部分餐品特制 |
| 2026-07-16 | 1.0.6 | 历史订单查询、餐品优惠价展示、随单购麦金卡/早餐卡 |
| 2026-07-29 | 1.0.7 | 派对、品鉴会等主题活动查询/预约/下单 |
| 2026-08-27 | 1.0.8 | 积分抽奖（活动信息、抽奖、我的奖品） |

# 麦当劳官方 MCP 文档（原文抓取，图片已移除）

> 来源: https://open.mcd.cn/mcp/doc ｜ 抓取日期: 2026-10-15

# 1. 申请 MCP Token
- 第一步：点击右上角【登录】按钮
- 第二步：跳转到登录页使用手机号验证登录
  登录成功后返回首页，“登录”按钮变为“控制台”按钮
- 第三步：申请 MCP Token

  点击右上角“控制台”后，会弹出控制台弹窗

  点击激活按钮，申请 MCP Token
- 第四步：同意服务协议
- 第五步：MCP Token 申请成功，可以一键复制

# 2. 快速开始
> 下面介绍如何将 MCP Server 接入到 MCP Client 中，开始使用 MCP 功能。

> 麦当劳中国提供了远程托管的 MCP Server，用户只需在 MCP Client 中配置接入地址和 MCP Token 即可使用。

## 2.1 接入地址
> 服务器接入地址：`https://mcp.mcd.cn`

## 2.2 传输协议与安全
> 使用 **Streamable HTTP** 协议接入

> 为了识别用户身份和权限，需要在请求头中携带 **Authorization** 字段，格式如下：
``` text
Authorization: Bearer YOUR_MCP_TOKEN
```

## 2.3 MCP 配置 JSON 示例：
> 为方便使用，我们提供了 JSON 配置示例。

> 复制下面的配置，替换 **YOUR_MCP_TOKEN** 为实际 MCP Token，粘贴到 MCP Client 的 MCP Server 配置中即可。
``` json
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

## 2.4 注意事项：
> - 每个 Token 每分钟最多允许 600 次请求，超过限制会返回 429 错误码，请合理控制请求频率。
> - 请确保 MCP Client 支持 Streamable HTTP 协议。
> - 请妥善保管 MCP Token，避免泄露给他人。

## 2.5 各平台接入教程：
### 2.5.1 Cherry Studio
> **前置条件**：需申请到麦当劳中国的 MCP Token，教程：[申请 MCP Token](#1-申请-mcp-token)

> 参考 Cherry Studio 官方文档：https://docs.cherry-ai.com/advanced-basic/mcp

1、 打开 Cherry Studio，进入设置页面

2、 选择“MCP”选项卡

3、 点击“添加”按钮

4、 在弹出的下拉框中，选择“从 JSON 导入”

复制上方的 JSON 配置并粘贴到此处，**请务必将“YOUR_MCP_TOKEN”替换为实际的 MCP Token**，然后点击“确定”按钮。

添加完成后，请打开启用开关

配置完成。现在可以在聊天窗口中使用 MCP 功能。

### 2.5.2 Cursor
> 前置条件：需申请到麦当劳中国的 MCP Token，教程：[申请 MCP Token](#1-申请-mcp-token)

> 参考 Cursor 官方文档：https://cursor.com/cn/docs/context/mcp

打开 Cursor，点击顶部菜单栏【设置】→【Tools & MCP】，在 Installed MCP Servers 中点击【Add Custom MCP】

在打开的 `mcp.json` 文件中粘贴上方的 JSON 配置，并将 `YOUR_MCP_TOKEN` 替换为实际的 MCP Token。然后点击【关闭】并选择【保存】。

返回设置页面后，应能看到可用的麦当劳 MCP 工具，且服务状态应显示为【已连接】。

按下 `Ctrl/Cmd + L` 打开右侧的 Agent 对话框。接下来，即可在对话框中输入需求，让 AI 调用相应工具。

### 2.5.3 TRAE
> 前置条件：需申请到麦当劳中国的 MCP Token，教程：[申请 MCP Token](#1-申请-mcp-token)

> 参考 TRAE 官方文档：https://docs.trae.cn/ide/model-context-protocol

打开 Trae，点击【设置】→【MCP】→ 【手动添加】进行添加

在手动配置页面中粘贴上方的 JSON 配置，并将 `YOUR_MCP_TOKEN` 替换为实际的 MCP Token，然后点击【确认】。

返回 MCP 页面后，应能看到可用的麦当劳 MCP 工具，且服务状态应显示为【已连接】。

返回对话框，选择【Builder with MCP】。

接下来，即可在对话框中输入需求，让 AI 调用相应工具。

## 2.6 错误码说明

| code | 原因 | 处理建议 |
|:----:|:----:|:---------|
| 401 | MCP Token 无效、已过期或未提供 | 检查 Authorization 请求头和 MCP Token 配置 |
| 429 | 触发限流（超过 600 次/分钟） | 降低请求频率，合理控制调用间隔 |

# 3. 调试指南
## 3.1 MCP Client 推荐

|    Client     |                                 Link                                 |
|:-------------:|:--------------------------------------------------------------------:|
| Cherry Studio |            https://docs.cherry-ai.com/advanced-basic/mcp             |
|    Cursor     |       https://cursor.com/cn/docs/context/mcp#protocol-support        |
|     Kiro      |                      https://kiro.dev/docs/mcp/                      |
|     Trae      |           https://docs.trae.cn/ide/model-context-protocol            |
|    VSCode     | https://code.visualstudio.com/docs/copilot/customization/mcp-servers |

## 3.2 LLM 推荐

截至 2026 年 2 月 12 日

|    厂商    |           型号           |
|:--------:|:----------------------:|
|   Qwen   | qwen-plus<br>qwen3-max |
|  Doubao  |    Doubao-Seed-1.6     |
|   Kimi   |          k2.5          |
|  Zhipu   |         GLM-5          |
|  Gemini  | gemini-3-flash-preview |
| DeepSeek |     DeepSeek-V3.2      |

# 4. 工具
> MCP Server 目前所支持的 Tools
## 4.1 工具列表

<table>
  <thead>
    <tr>
      <th style="white-space: nowrap; text-align: center;"><strong>Tool</strong></th>
      <th style="min-width: 100px;"><strong>Name</strong></th>
      <th><strong>Description</strong></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="white-space: nowrap; text-align: center;">list-nutrition-foods</td>
      <td>餐品营养信息列表</td>
      <td>获取麦当劳常见餐品的营养成分数据，包括能量、蛋白质、脂肪、碳水化合物、钠、钙等信息。当用户咨询麦当劳餐品的热量、营养，或需要帮助用户搭配指定热量套餐时使用此工具</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">delivery-query-addresses</td>
      <td>获取用户可配送地址列表</td>
      <td>查询用户已创建的配送地址列表，用于外送点餐时选择配送地址</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">delivery-create-address</td>
      <td>新增配送地址</td>
      <td>当用户无可配送地址或需新增收货地址时使用，用于创建新的可配送地址</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">delivery-query-stores</td>
      <td>查询可配送的门店列表</td>
      <td>外送场景下查询用户收货地址附近可配送门店</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">query-meal-assistance</td>
      <td>查询助餐服务</td>
      <td>仅企业团餐场景下，查询该门店支持的助餐服务</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">query-nearby-stores</td>
      <td>查询附近可用门店</td>
      <td>查询用户提供地址附近的麦当劳餐厅</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">query-store-coupons</td>
      <td>查询用户当前门店下可用的优惠券列表</td>
      <td>查询用户在当前门店下可使用的优惠券列表，用于点餐时选择可用优惠</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">query-meals</td>
      <td>查询当前可售卖的餐品列表</td>
      <td>查询当前门店可售卖的餐品菜单（分类、餐品编码、标签等），用于点餐选品</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">query-meal-detail</td>
      <td>查询餐品详情</td>
      <td>根据餐品编码查询餐品详情套餐组成，用于查看套餐包含内容以及可以替换选项</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">calculate-price</td>
      <td>商品价格计算</td>
      <td>根据用户选购商品列表（可含优惠券）计算商品金额、配送费、优惠金额及应付总价</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">create-order</td>
      <td>创建订单</td>
      <td>根据门店信息、就餐方式、商品列表等信息创建订单，返回订单详情与支付链接</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">cancel-order</td>
      <td>取消订单</td>
      <td>取消点餐订单。当用户说"取消订单"、"我要取消"、"帮我取消一下订单"时，可使用该工具进行取消</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">query-order</td>
      <td>查询订单详情</td>
      <td>查询订单状态、订单内容、配送信息等，用于用户查看订单进度或确认订单信息</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">order-list</td>
      <td>查询历史订单</td>
      <td>查询近期的到店/外送历史订单（非商城订单，商城订单请使用 mall-order-list）</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">campaign-calendar</td>
      <td>活动日历查询工具</td>
      <td>查询麦当劳中国当月的营销活动日历，返回进行中、往期和未来日期的活动</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">available-coupons</td>
      <td>麦麦省券列表查询</td>
      <td>查询用户当前可领取的麦麦省的优惠券列表</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">auto-bind-coupons</td>
      <td>麦麦省一键领券</td>
      <td>自动领取麦麦省所有当前可用的麦当劳优惠券。无需指定具体的优惠券和couponId，系统会自动领取用户可领的所有券</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">query-my-coupons</td>
      <td>我的优惠券查询</td>
      <td>查询用户有哪些可用的优惠券。支持用户查看账户下所有优惠券列表</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">query-my-account</td>
      <td>我的积分查询</td>
      <td>查询用户积分账户信息，包括可用积分、累计积分、冻结积分、即将过期积分等</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">mall-points-products</td>
      <td>查询麦麦商城商品列表</td>
      <td>查询麦麦商城内可使用积分兑换或现金购买的商品（不包括使用积分兑换的第三方兑换码）</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">mall-product-detail</td>
      <td>查询麦麦商城商品详情</td>
      <td>查询商城商品详细信息（图片、积分、有效期、说明、详情等）</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">mall-create-order</td>
      <td>积分兑换商品下单</td>
      <td>使用积分兑换虚拟或实物商品，完成积分校验、积分扣减及发券或实物库存扣减，返回兑换订单号和券码信息</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">now-time-info</td>
      <td>获取当前时间信息</td>
      <td>返回当前的完整时间信息，以便于 LLM 知道当前的时间和日期</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">query-lottery-info</td>
      <td>查看积分抽奖活动信息</td>
      <td>查询当前积分抽奖活动的基本信息，包括活动状态、奖品列表、抽奖消耗规则和用户可用资源</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">draw-lottery</td>
      <td>积分抽奖</td>
      <td>执行一次积分抽奖，消耗积分或次数，返回是否中奖及奖品信息</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">query-my-prizes</td>
      <td>查看我的奖品</td>
      <td>查询用户在积分抽奖活动中获得的全部奖品记录，支持分页，按中奖时间倒序排列</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">mall-order-list</td>
      <td>麦麦商城订单查询</td>
      <td>查询麦麦商城内近一年购买或兑换的商品订单列表</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">mall-order-detail</td>
      <td>麦麦商城订单详情查询</td>
      <td>查询麦麦商城订单的详细信息，包括支付积分、支付金额和订单状态等</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">query-party-city</td>
      <td>主题活动城市列表查询</td>
      <td>查询主题活动商品对应的可参与城市列表</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">query-party-store</td>
      <td>主题活动门店列表查询</td>
      <td>查询指定城市下主题活动可参与的门店列表</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">query-partystore-date</td>
      <td>主题活动可预约日期查询</td>
      <td>查询指定门店下主题活动的可预约日期列表</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">query-partystore-session</td>
      <td>主题活动可预约日期场次查询</td>
      <td>查询指定门店、指定日期下主题活动的可预约场次列表</td>
    </tr>
    <tr>
      <td style="white-space: nowrap; text-align: center;">party-order-create</td>
      <td>主题活动订单创建</td>
      <td>创建主题活动订单，当用户选择好城市、门店、日期、场次后使用此工具下单</td>
    </tr>
  </tbody>
</table>

## 4.2 点餐

### 4.2.1 餐品营养信息列表

**描述：**
> 获取麦当劳常见餐品的营养成分数据，包括能量、蛋白质、脂肪、碳水化合物、钠、钙等信息。当用户咨询麦当劳餐品的热量、营养，或需要帮助用户搭配指定热量套餐时使用此工具。

**入参：**
> 无需入参

**响应内容：**
> 注意：为降低 LLM Token 消耗，营养信息采用紧凑的 TOON（Token-Oriented Object Notation）格式返回，而非标准 JSON 数组格式。

示例：
``` json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-01-23 09:32:44",
    "data": "[1]{productName,nutritionDescription,energyKj,energyKcal,protein,fat,carbohydrate,sodium,calcium}:\
  猪柳麦满分,null,1288,308,16,16,24,781,213\
 "
}
```
### 4.2.2 获取用户可配送地址列表

**描述：**   
> 查询用户已创建的配送地址列表。当用户说："我想点一份麦当劳外送到家"、"我想吃麦当劳"时，会使用该工具查询用户可配送的地址列表。

**入参：**  
> 无需入参

**响应内容：**

示例：
```json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-02-09 14:29:28",
    "traceId": "f2a0d969353467c957fd6728166eb430",
    "data": {
        "addresses": [
            {
                "addressId": "1",
                "contactName": "张三",
                "phone": "152****6666",
                "fullAddress": "xx省xx市xxx小区 x栋x单元xxx室"
            }
        ]
    }
}
```
### 4.2.3 新增配送地址

**描述：**  
> 用户没有可配送地址，或当前列表中没有用户需要的配送地址时，可使用该工具新增配送地址。

**入参：**

| name | description |
|------|-------------|
| city | 城市名称，必填，必须从用户输入中获取实际城市名称，如"南京市" |
| contactName | 联系人姓名，必填，必须从用户输入中获取实际联系人姓名，如"李明" |
| gender | 性别，非必填，如"先生"、"女士" |
| phone | 联系人电话号码，必填，必须从用户输入中获取实际电话号码，类型为 11 位纯数字，如 "16666666666" |
| address | 配送地址，必填，必须从用户输入中获取实际地址，如"清竹园9号楼" |
| addressDetail | 配送地址门牌号，必填，必须从用户输入中获取实际门牌号，如"2单元508" |

**响应内容：**

示例：
```json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-02-09 14:29:28",
    "traceId": "f2a0d969353467c957fd6728166eb430",
    "data": {
        "addressId": "1",
        "contactName": "张三",
        "phone": "152****6666",
        "fullAddress": "xx省xx市xxx小区 x栋x单元xxx室"
    }
}
```
### 4.2.4 查询可配送的门店列表

**描述：**  
> 在外送场景（包括麦乐送和企业团餐）下，用户选择地址后，可根据地址 ID 查询能够配送至该地址的门店。

**入参：**

| name | description |
|------|-------------|
| addressId | 用户选择的地址 ID，必填 |
| beType | 必填，2：麦乐送；6：企业团餐 |

**响应内容：**

示例：
```json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-04-28 11:32:39",
    "traceId": "19df0dfba930e166f77437c85f8df037",
    "data": [
        {
            "storeCode": "xxxxxx",
            "beCode": "xxxx",
            "storeName": "麦当劳xxxx餐厅",
            "reservation": true,
            "reservationTimeOptions": [
                {
                    "date": "2026-04-29",
                    "today": false,
                    "reservationOptionText": "早餐(06:00至09:59)"
                },
                {
                    "date": "2026-04-30",
                    "today": false,
                    "reservationOptionText": "早餐(06:00至09:59)"
                },
                {
                    "date": "2026-05-01",
                    "today": false,
                    "reservationOptionText": "早餐(06:00至09:59)"
                },
                {
                    "date": "2026-05-02",
                    "today": false,
                    "reservationOptionText": "早餐(06:00至09:59)"
                },
                {
                    "date": "2026-05-03",
                    "today": false,
                    "reservationOptionText": "早餐(06:00至09:59)"
                }
            ],
            "businessStatus": true,
            "businessStartTime": "00:00",
            "businessEndTime": "23:59"
        },
        {
            "storeCode": "xxxx",
            "beCode": "xxxxx",
            "storeName": "麦当劳xxxxx",
            "reservation": true,
            "reservationTimeOptions": [
                {
                    "date": "2026-04-28",
                    "today": true,
                    "reservationOptionText": "午餐(10:30至15:29)，下午茶(15:30至17:59)，夜市(18:00至23:59)"
                },
                {
                    "date": "2026-04-29",
                    "today": false,
                    "reservationOptionText": "夜市(00:00至00:59,01:00至05:59,18:00至23:59)，早餐(06:00至10:29)，午餐(10:30至15:29)，下午茶(15:30至17:59)"
                },
                {
                    "date": "2026-04-30",
                    "today": false,
                    "reservationOptionText": "夜市(00:00至00:59,01:00至05:59,18:00至23:59)，早餐(06:00至10:29)，午餐(10:30至15:29)，下午茶(15:30至17:59)"
                },
                {
                    "date": "2026-05-01",
                    "today": false,
                    "reservationOptionText": "夜市(00:00至00:59,01:00至05:59,18:00至23:59)，早餐(06:00至10:29)，午餐(10:30至15:29)，下午茶(15:30至17:59)"
                },
                {
                    "date": "2026-05-02",
                    "today": false,
                    "reservationOptionText": "夜市(00:00至00:59,01:00至05:59,18:00至23:59)，早餐(06:00至10:29)，午餐(10:30至15:29)，下午茶(15:30至17:59)"
                },
                {
                    "date": "2026-05-03",
                    "today": false,
                    "reservationOptionText": "夜市(00:00至00:59,01:00至05:59,18:00至23:59)，早餐(06:00至10:29)，午餐(10:30至15:29)，下午茶(15:30至17:59)"
                }
            ],
            "businessStatus": true,
            "businessStartTime": "00:00",
            "businessEndTime": "23:59"
        }
    ]
}
```
### 4.2.5 查询助餐服务

**描述：**  
> 仅企业团餐场景下，查询该门店可使用的助餐服务

**入参：**

| name | description |
|------|-------------|
| storeCode | 门店编码，必填 |
| beCode | BE编码，必填 |
| beType | 业务类型，必填，仅支持团餐 beType=6 |
| orderType | 订单类型，必填，仅支持 orderType=2 外送 |
| reservationDate | 预约时间，非必填，格式 yyyy-MM-dd HH:mm，可根据预约时间确定助餐服务是否可用 |

**响应内容：**

示例：
```json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-04-28 11:34:00",
    "traceId": "a8f4cc0361d377d9d68da56c4048c362",
    "data": {
        "mealAssistanceItems": [
            {
                "gmServiceCode": "GMSxxx",
                "gmServiceName": "保鲜速达",
                "serviceItems": ["准时送达&餐品保温"],
                "selected": true,
                "enable": true
            },
            {
                "gmServiceCode": "GMS0xx",
                "gmServiceName": "专人分餐",
                "serviceItems": ["独立分装&餐品保温", "送餐到桌/到人"],
                "enable": true
            },
            {
                "gmServiceCode": "GMS0xx",
                "gmServiceName": "专人摆台",
                "serviceItems": ["独立分装&餐品保温", "餐品摆台", "专人服务"],
                "enable": true
            }
        ],
        "promotions": [
            "保鲜速达: 满300享78折/满500享74折/满1000享70折/满2000享66折",
            "专人分餐: 满300享88折/满500享84折/满1000享80折/满2000享76折",
            "专人摆台: 满300享93折/满500享89折/满1000享85折/满2000享81折"
        ]
    }
}
```
### 4.2.6 查询附近可用门店

**描述：**  
> 在到店场景下，查询用户附近可供点餐的门店。调用前需确认用户选择到店取餐还是得来速车道取餐。该工具仅支持这两种场景。

**入参：**

| name | description |
|------|-------------|
| searchType | 必填，1: 搜索收藏餐厅，2: 按位置进行搜索，3: 按经纬度搜索，默认 searchType=1 |
| beType | 必填，1: 到店自取，5: 得来速车道取餐(Drive Through) |
| city | 城市，仅在searchType=2时必填 |
| keyword | 位置关键词，仅在searchType=2时必填 |
| longitude | 经度，仅当searchType=3时有效且必填 |
| latitude | 纬度，仅当searchType=3时有效且必填 |

**响应内容：**

示例：
```json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-02-09 14:44:29",
    "traceId": "341e2dce2af4a61497b52097125a8a77",
    "data": [
        {
            "storeCode": "xxxxxx",
            "beCode": "xxxx",
            "storeName": "麦当劳xxxx餐厅",
            "address": "", // 门店地址
            "distance": "", // 搜索位置距离门店位置的距离
            "reservation": true,
            "reservationTimeOptions": [
                {
                    "date": "2026-04-29",
                    "today": false,
                    "reservationOptionText": "早餐(06:00至09:59)"
                },
                {
                    "date": "2026-04-30",
                    "today": false,
                    "reservationOptionText": "早餐(06:00至09:59)"
                },
                {
                    "date": "2026-05-01",
                    "today": false,
                    "reservationOptionText": "早餐(06:00至09:59)"
                },
                {
                    "date": "2026-05-02",
                    "today": false,
                    "reservationOptionText": "早餐(06:00至09:59)"
                },
                {
                    "date": "2026-05-03",
                    "today": false,
                    "reservationOptionText": "早餐(06:00至09:59)"
                }
            ],
            "businessStatus": true,
            "businessStartTime": "00:00",
            "businessEndTime": "23:59"
        }
    ]
}
```
### 4.2.7 查询用户当前门店下可用的优惠券列表

**描述：**  
> 查询用户在当前门店和取餐方式下可用的优惠券。当用户询问当前门店和取餐方式下有哪些可用优惠券时，可使用该工具查询。

**入参：**

| name | description |
|------|-------------|
| storeCode | 门店编码，必填 |
| beCode | BE编码（Business Entity Code） |
| orderType | 必填，订单类型，orderType=1 到店，orderType=2 外送 |
| beType | 必填，业务类型，1: 到店取餐，2: 麦乐送到家，5: 得来速(DT)，6: 企业团餐 |
| reservationDate | 预约时间，预约场景下必填，格式 yyyy-MM-dd HH:mm |

**响应内容：**

示例：
```json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-02-09 14:32:41",
    "traceId": "0f694a844e393e6cb0717455d9229a24",
    "data": [
        {
            "title": "外送优惠券二次券",
            "couponId": "xxxxxxxxxx",
            "couponCode": "xxxxxx",
            "tradeDateTime": "2025-04-21 23:23:00-2026-07-01 23:59:59",
            "products": [
                {
                    "productCode": "xxxxxxxxx",
                    "productName": "甜蜜小食1+1"
                }
            ]
        }
    ]
}
```
### 4.2.8 查询当前可售卖的餐品列表

**描述：**  
> 查询当前门店可售卖的餐品列表。当用户希望获取门店菜单或点餐时，可调用该工具获取当前门店的可售餐品。

**入参：**

| name | description |
|------|-------------|
| storeCode | 门店编码，必填 |
| beCode | BE编码（Business Entity Code） |
| orderType | 必填，到店: orderType=1，外送: orderType=2 |
| beType | 必填，业务类型，1: 到店取餐，2: 麦乐送到家，5: 得来速(DT)，6: 企业团餐 |
| reservationDate | 预约时间，预约场景下必填，格式 yyyy-MM-dd HH:mm |

**响应内容：**

示例：
```json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-02-09 09:47:35",
    "traceId": "4b2b4de1d772dad2dc498597c65cf3af",
    "data": {
        "frequent": [
            {
                "code": "9900008139", // 常点餐品的餐品code
                "tags": [] // 我的常点
            }
        ],
        "categories": [
            {
                "name": "人气热卖",
                "meals": [
                    {
                        "code": "9900008139",
                        "tags": []
                    },
                    {
                        "code": "9900008169",
                        "tags": []
                    },
                    {
                        "code": "920215",
                        "tags": [
                            "第二份半价"
                        ]
                    }
                ],
                "daypart": 8
            }
        ],
        "meals": {
            "920215": {
                "name": "培根安格斯厚牛堡大套餐",
                "currentPrice": "55.5",
                "image": "xxxx.jpeg", // 商品图片
                "originalPrice": "65.5", // 商品原价
                "discountType": "随单购麦金卡优惠",  // null-不享受优惠，"早餐卡优惠"，"促销优惠"，"麦金卡优惠"，"随单购早餐卡优惠"，"随单购麦金卡优惠",
                "isCanWithOrder": true, // 是否可随单购麦金卡或者早餐卡,
                "withOrder": {
                    "cardId": "",  // 随单购早餐卡卡id
                    "cardType": "", // 随单购早餐卡类型
                    "membershipCode": "106", // 随单购麦金卡会员的code
                    "specId": "xxx" // 随单购麦金卡规格
                }  // 用户选择随单购时，随单购商品需要带入算价和下单
            },
            "9900008139": {
                "name": "DC套餐测试",
                "currentPrice": "14",
                "originalPrice": "14", // 商品原价
                "discountType": null
            },
            "9900008169": {
                "name": "双层深海鳕鱼堡",
                "currentPrice": "25",
                "originalPrice": "26.5", // 商品原价
                "discountType": "促销优惠"
            }
        }
    }
}
```
**重点注意：**
> 自 v1.0.6 起，餐品列表新增促销价（划线价）与随单购信息，详见响应内容中的 `originalPrice`、`discountType`、`isCanWithOrder`、`withOrder` 字段说明。
### 4.2.9 查询餐品详情

**描述：**
> 根据餐品列表中返回的餐品编码，可以查看套餐的组成等信息。当用户需要查看餐品详情时使用此工具。 

**重点注意：**
> 自 v1.0.5 起，已支持更换套餐内商品组合及部分餐品特制（详见 `modification` 字段）。

**入参：**

| name | description |
|------|-------------|
| code | 餐品编码，必填 |
| storeCode | 门店编码，必填 |
| beCode | BE编码（Business Entity Code） |
| orderType | 必填，到店: orderType=1，外送: orderType=2 |
| beType | 必填，业务类型，1: 到店取餐，2: 麦乐送到家，5: 得来速(DT)，6: 企业团餐 |
| reservationDate | 预约时间，预约场景下必填，格式 yyyy-MM-dd HH:mm |

**响应内容：**

示例：
```json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-06-09 14:20:14",
    "traceId": "2e4ed6a62c22a11b562f0338aaea1c02",
    "data": {
        "code": "520860",
        "name": "咔滋咔滋脆鸡腿堡",
        "price": "26",
        "rounds": [],
        "image": "https://menu-img.mcdchina.net/pcm/sit/menu/ProductPool/product/MS_520860_600.png",
        "modification": {
            "items": [
                {
                    "maxValues": 3,
                    "minValues": 0,
                    "values": [
                        {
                            "code": "120524",
                            "price": 0,
                            "name": "秘制花生沙拉酱",
                            "maxQuantity": 1,
                            "minQuantity": 0,
                            "selectedQuantity": 1,
                            "selectedKey": "0-1",
                            "unselectedKey": "0-0"
                        },
                        {
                            "code": "100160",
                            "price": 0,
                            "name": "番茄片",
                            "maxQuantity": 1,
                            "minQuantity": 0,
                            "selectedQuantity": 1,
                            "selectedKey": "0-1",
                            "unselectedKey": "0-0"
                        },
                        {
                            "code": "101125",
                            "price": 0,
                            "name": "生菜",
                            "maxQuantity": 1,
                            "minQuantity": 0,
                            "selectedQuantity": 1,
                            "selectedKey": "0-1",
                            "unselectedKey": "0-0"
                        }
                    ]
                }
            ]
        },
        "supportModify": true
    }
}
```
### 4.2.10 商品价格计算

**描述：**  
> 计算用户所购商品的价格及优惠金额。当用户询问商品或商品组合的价格时，可使用该工具获取订单价格信息。

**入参：**

| name | description |
|------|-------------|
| storeCode | 门店编码，必填 |
| beCode | BE编码 |
| orderType | 必填，到店: orderType=1，外送: orderType=2 |
| beType | 必填，业务类型，1: 到店取餐，2: 麦乐送到家，5: 得来速(DT)，6: 企业团餐 |
| reservationDate | 预约时间，预约场景下必填，格式 yyyy-MM-dd HH:mm |
| gmServiceCode | 企业团餐场景下，助餐服务code |
| withOrder | 随单购商品，数据来源于餐品列表返回的 `withOrder` 字段。用户期望享受随单购优惠时，需要将该数据带入算价 |
| needTableware | 是否需要餐具费 |
| items | 商品列表（数组） |

`items` 字段结构：

| name | description |
|------|-------------|
| productCode | 商品编码，必填 |
| quantity | 商品数量，必填 |
| couponId | 优惠券ID，选填（如果用户要使用优惠券） |
| couponCode | 优惠券编码，选填（如果用户要使用优惠券） |
| modification | 单品特调 |
| roundList | 商品子项 |

`modification` 字段结构：

| name | description |
|------|-------------|
| values | 特调选项列表 |

`modification.values` 字段结构：

| name | description |
|------|-------------|
| code | 特调商品code |
| quantity | 特调商品数量 |
| key | 特调key |

`roundList` 字段结构：

| name | description |
|------|-------------|
| round | 子项id |
| comboItemList | 子项明细 |

`roundList.comboItemList` 字段结构：

| name | description |
|------|-------------|
| code | 子项商品Code |
| quantity | 数量 |
| modification | Choice特调内容（结构同上 `modification`） |

**响应内容：**

示例：
```json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-02-09 14:39:50",
    "traceId": "1f90ace087d33bdabd3b8c27da4e7b0a",
    "data": {
        "productOriginalPrice": 1600,
        "productPrice": 1600,
        "deliveryOriginalPrice": 600,
        "deliveryPrice": 600,
        "originalPrice": 2200,
        "discount": 0,
        "price": 2200,
        "productList": [
            {
                "productCode": "xxxxxxx",
                "productName": "DC套餐测试",
                "quantity": 1,
                "originalSubtotal": 1600,
                "subtotal": 1600
            }
        ],
        "takeWayList": [],          // 到店场景下：可选的取餐方式选项列表
        "mealAssistanceList": [],   // 团餐场景下：可选的助餐服务列表
        "tablewarePrice": 10        // 餐具费，单位分
    }
}
```
### 4.2.11 创建订单

**描述：**  
> 创建订单。当用户说："帮我下单xxx商品"、"确认下单"时，可以使用该工具进行下单。

**入参：**

| name | description |
|------|-------------|
| storeCode | 门店编码，必填 |
| beCode | BE编码 |
| addressId | 外送场景下必填 |
| takeWayCode | 到店场景下必填，需要从价格计算工具中获取 |
| beType | 必填，业务类型，1: 到店取餐，2: 麦乐送到家，5: 得来速(DT)，6: 企业团餐 |
| reservationDate | 预约时间，预约场景下必填，格式 yyyy-MM-dd HH:mm |
| gmServiceCode | 企业团餐场景下，助餐服务code必填 |
| withOrder | 随单购商品，数据来源于餐品列表返回的 `withOrder` 字段。用户期望享受随单购优惠时，需要将该数据带入下单 |
| needTableware | 是否需要餐具费 |
| remark | 订单备注（选填，最多50字），如"无接触配送"，仅 orderType=2 场景下需要引导用户填写 |
| items | 商品列表（数组） |

`items` 字段结构：

| name | description |
|------|-------------|
| productCode | 商品编码，必填 |
| quantity | 商品数量，必填 |
| couponId | 优惠券ID，选填（如果用户要使用优惠券） |
| couponCode | 优惠券编码，选填（如果用户要使用优惠券） |
| modification | 单品特调 |
| roundList | 商品子项 |

`modification` 字段结构：

| name | description |
|------|-------------|
| values | 特调选项列表 |

`modification.values` 字段结构：

| name | description |
|------|-------------|
| code | 特调商品code |
| quantity | 特调商品数量 |
| key | 特调key |

`roundList` 字段结构：

| name | description |
|------|-------------|
| round | 子项id |
| comboItemList | 子项明细 |

`roundList.comboItemList` 字段结构：

| name | description |
|------|-------------|
| code | 子项商品Code |
| quantity | 数量 |
| modification | Choice特调内容（结构同上 `modification`） |

**响应内容：**

示例：
```json
{
  "success": true,
  "code": 200,
  "message": "请求成功",
  "datetime": "2026-02-09 14:42:51",
  "traceId": "80572509920e2e1e4a4373ee9eeca070",
  "data": {
    "orderId": "1030938730000733964700499858",
    "payId": "11940981078137585664",
    "payH5Url": "https://m-sit.mcdchina.net/mcp/scanToPay?orderId=1030938730000733964700499858",
    "orderDetail": {
      "orderStatus": "待支付",
      "storeName": "xxxxxx门店",
      "storeAddress": "xxxxx",
      "orderProductList": [
        {
          "productName": "DC套餐测试",
          "quantity": 1,
          "price": "16",
          "comboItemList": [
            {
              "itemName": "汉堡包-pool1 加一份奶油(加)",
              "itemQuantity": 1
            }
          ]
        }
      ],
      "totalAmount": "22",
      "realTotalAmount": "22",
      "totalDiscountAmount": "0",
      "couponList": [],
      "deliveryInfo": {
        "deliveryType": "立即送出",
        "deliveryAddress": "xxxx小区-xx栋",
        "addressDetail": "xxx号房间",
        "customerNickname": "张三",
        "mobilePhone": "152****6666",
        "expectDeliveryTime": ""
      },
      "createTime": "2026-02-09 14:42:51",
      "deliveryPrice": "6",
      "realDeliveryPrice": "6",
      "productPrice": "16",
      "takeWay": "locker-in",        // 店内取餐柜
      "pickupCode": "",               // 订单号
      "lockerCode": "",               // 取餐柜密码
      "mealAssistance": {
        "code": "",                   // 取餐服务
        "name": "",                   // 助餐服务名称
        "items": [
          {
            "name": ""                // 助餐服务项目列表
          }
        ]
      },
      "lockerQrCode": "https://xxxx.png",  // 取餐柜码
      "remark": "订单备注"                  // 订单备注，仅外送场景下需要填写，且不能超过50字
    }
  }
}
```
### 4.2.12 取消订单

**描述：**  
> 取消点餐订单。当用户说："取消订单"、"我要取消"、"帮我取消一下订单"时，可使用该工具进行取消。

**入参：**

| name | description |
|------|-------------|
| orderId | 订单号，必填 |
| cancelReasonCode | 取消原因code，必填，1: 改主意了，2: 重复下单，3: 点错了/点多了/点少了，4: 地址/电话填错了，5: 送达时间选错了，-1: 其它原因 |

**响应内容：**

示例：
```json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-07-13 10:09:52",
    "traceId": "5c5ff75fd9e1f42a2ab51a13077d5204",
    "data": {
        "cancelResult": true,
        "orderId": ""
    }
}
```
### 4.2.13 查询订单详情

**描述：**  
> 查询订单详情。当用户说："帮我看一下订单进度"、"看看现在配送到哪里了"时，可以使用该工具获取进度信息。

**入参：**

| name | description |
|------|-------------|
| orderId | 订单号，必填 |

**响应内容：**

示例：
```json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-02-09 14:44:29",
    "traceId": "341e2dce2af4a61497b52097125a8a77",
    "data": {
        "orderId": "1030938730000733964700499858",
        "orderStatus": "待支付",
        "storeName": "xxxxx门店",
        "orderProductList": [
            {
                "productName": "DC套餐测试",
                "productImage": "https://img.mcd.cn/gallery/xxxx.png",
                "quantity": 1,
                "price": "16",
                "comboItemList": [
                    {
                        "itemName": "汉堡包-pool1 加一份奶油(加)",
                        "itemQuantity": 1
                    }
                ]
            }
        ],
        "totalAmount": "22",
        "realTotalAmount": "22",
        "totalDiscountAmount": "0",
        "couponList": [],
        "deliveryInfo": {
            "deliveryType": "立即送出",
            "deliveryAddress": "xxxx小区-xx栋",
            "addressDetail": "xxx号房间",
            "customerNickname": "张三",
            "mobilePhone": "152****6666",
            "expectDeliveryTime": ""
        },
        "createTime": "2026-02-09 14:42:51",
        "deliveryPrice": "6",
        "realDeliveryPrice": "6",
        "productPrice": "16",
        "takeWay": "locker-in",              // 店内取餐柜
        "pickupCode": "",                    // 订单号
        "lockerCode": "",                    // 取餐柜密码
        "mealAssistance": {
            "code": "",                      // 取餐服务
            "name": "",                      // 助餐服务名称
            "items": [
                {
                    "name": ""               // 助餐服务项目列表
                }
            ]
        },
        "lockerQrCode": "https://xxxx.png",  // 取餐柜码
        "remark": "订单备注"                  // 订单备注，仅外送场景下需要填写，且不能超过50字
    }
}
```
### 4.2.14 查询历史订单

**描述：**
> 查询近期的历史订单（不包括商城订单；查询商城订单请使用 `mall-order-list`）。当用户询问“我最近买了哪些麦当劳餐品”或“帮我查询一下历史订单”时，可使用该工具。历史订单较多时，仅返回最近 10 笔订单。

**入参：**
> 无需入参

**响应内容：**

示例：
```json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-07-13 10:09:52",
    "traceId": "5c5ff75fd9e1f42a2ab51a13077d5204",
    "data": {
        "list": [
            {
                "orderId": "123456789010010",
                "orderType": "1",
                "createTime": "2026-07-07 11:03:35",
                "beType": "1",
                "beCode": "",
                "storeCode": "xxxxxx",
                "storeName": "xxxx",
                "orderStatus": "订单已取消",
                "orderProductList": [
                    {
                        "productCode": "9900006248",
                        "productName": "苹板支撑便民套餐",
                        "quantity": 1,
                        "comboItemList": [
                            {
                                "productCode": "1406",
                                "name": "新升级板烧鸡腿堡_1547",
                                "quantity": 1
                            },
                            {
                                "productCode": "6102",
                                "name": "苹果片一袋(60g)",
                                "quantity": 1
                            },
                            {
                                "productCode": "3071",
                                "name": "无糖可口可乐中杯",
                                "quantity": 1
                            }
                        ]
                    },
                    {
                        "productCode": "9900006248",
                        "productName": "苹板支撑便民套餐",
                        "quantity": 1,
                        "comboItemList": [
                            {
                                "productCode": "1406",
                                "name": "新升级板烧鸡腿堡_1547",
                                "quantity": 1
                            },
                            {
                                "productCode": "6102",
                                "name": "苹果片一袋(60g)",
                                "quantity": 1
                            },
                            {
                                "productCode": "3071",
                                "name": "无糖可口可乐中杯",
                                "quantity": 1
                            }
                        ]
                    }
                ],
                "realTotalAmount": "40"
            },
            {
                "orderId": "123456789010010",
                "orderType": "1",
                "createTime": "2026-06-29 14:20:09",
                "beType": "1",
                "beCode": "",
                "storeCode": "11231xx",
                "storeName": "麦当劳xxxx店",
                "orderStatus": "订单已完成",
                "orderProductList": [
                    {
                        "productCode": "9900006248",
                        "productName": "苹板支撑便民套餐",
                        "quantity": 1,
                        "comboItemList": [
                            {
                                "productCode": "1406",
                                "name": "新升级板烧鸡腿堡_1547",
                                "quantity": 1
                            },
                            {
                                "productCode": "6102",
                                "name": "苹果片一袋(60g)",
                                "quantity": 1
                            },
                            {
                                "productCode": "3071",
                                "name": "无糖可口可乐中杯",
                                "quantity": 1
                            }
                        ]
                    },
                    {
                        "productCode": "9900006248",
                        "productName": "苹板支撑便民套餐",
                        "quantity": 1,
                        "comboItemList": [
                            {
                                "productCode": "1406",
                                "name": "新升级板烧鸡腿堡_1547",
                                "quantity": 1
                            },
                            {
                                "productCode": "6102",
                                "name": "苹果片一袋(60g)",
                                "quantity": 1
                            },
                            {
                                "productCode": "3071",
                                "name": "无糖可口可乐中杯",
                                "quantity": 1
                            }
                        ]
                    }
                ],
                "realTotalAmount": "40"
            }
        ]
    }
}
```

---

## 4.3 互动与内容

### 4.3.1 活动日历查询工具

**描述：**
> 查询麦当劳中国当月的营销活动日历，返回进行中、往期和未来日期的活动。适用于查看用户进行中和即将到来的可参与活动，还可查询用户对活动的订阅状态。

**入参：**

|     name      |                              description                               |
|:-------------:|:----------------------------------------------------------------------:|
| specifiedDate | 查询指定日期附近共三天的活动，格式为 `yyyy-MM-dd`，非必填。默认查询当前月的活动；查询当天活动时无需入参 |

**响应内容：**
> 注意：活动内容为营销文案，可能包含表情符号等营销元素。

示例：
``` markdown
### 当前时间：2025-12-09 14:48:42
### 活动列表：
#### 12月8日 往期回顾
-   **活动标题**：小女警沙发！12月12日麦麦商城见！⏰

    **活动内容介绍**：❗️超萌酷小女警爱心沙发来袭
    😍小女警+汉堡刺绣+粉嫩配色
    ✨满满英雄力和快乐能量！
    💥12月12日14:00准时发售
    👇提前预约，心动别错过！

    **活动图片介绍**：

    <img src="https://cms-cdn.mcd.cn/img/short-content/86a849ae4b9528e53ac595ffa1b39cf9.png" alt="" height="300" width="auto">
#### 12月9日 今日
-   **活动标题**：⏳倒计时！超人气「芝芝火腿扒堡」即将回归！

    **活动内容介绍**：🍔松软芝芝火腿扒堡搭配鲜萃咖啡
    💥一堡+一咖啡！还是天天￥9.9！
    ☀一口下去给元气满满的早晨充能！
    ⏰12月15日起，超值低价闭眼冲！

    **活动图片介绍**：

    <img src="https://cms-cdn.mcd.cn/img/short-content/39bb241887869bca544b67a355cb616f.jpg" alt="" height="300" width="auto">
```

---
### 4.3.2 查看积分抽奖活动信息

**工具名：** `query-lottery-info`

**描述：**
> 查询当前积分抽奖活动的基本信息，包括活动状态、奖品列表、抽奖消耗规则和用户可用资源。当用户说："有什么抽奖活动"、"我能不能抽奖"、"积分抽奖还有几次机会"时，可以使用该工具查询。

**入参：**
> 无需入参

**响应内容：**

示例：
``` json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-08-20 15:00:00",
    "traceId": "xxxxxxxxxxxxxxxxxxxx",
    "data": {
        "status": {
            "code": "SUCCESS",
            "message": "成功"
        },
        "activityCode": "2m2t",
        "activityStatusText": "进行中",
        "activityName": "九宫格-dsp3",
        "beginTime": "2026-05-21 00:00:00",
        "endTime": "2027-06-30 23:59:59",
        "drawPoint": "10",
        "drawTypeText": "积分抽奖",
        "availableTimes": 5,
        "availablePoint": "1000",
        "drawDecision": {
            "resourceEligible": true,
            "reason": "积分充足且有剩余次数",
            "nextConsumption": {
                "type": "POINTS",
                "points": "10",
                "text": "消耗10积分"
            }
        },
        "prizes": [
            {
                "name": "一等奖：早餐卡7天",
                "imageUrl": "https://cdn.mcdchina.net/gallery/xxx.png",
                "typeText": "权益卡"
            },
            {
                "name": "二等奖：板烧霸王餐",
                "imageUrl": "https://cdn.mcdchina.net/gallery/xxx.png",
                "typeText": "优惠券"
            }
        ]
    }
}
```
---
### 4.3.3 积分抽奖

**工具名：** `draw-lottery`

**描述：**
> 执行一次积分抽奖。当用户说："帮我抽一次奖"、"我要抽奖"、"用积分抽奖"时，可以使用该工具进行抽奖。注意：该工具有频率限制（1秒内不可重复调用）。

**入参：**
> 无需入参

**响应内容：**

中奖示例：
``` json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-08-20 15:01:00",
    "traceId": "xxxxxxxxxxxxxxxxxxxx",
    "data": {
        "status": {
            "code": "SUCCESS",
            "message": "成功"
        },
        "win": true,
        "prizes": [
            {
                "name": "一等奖：早餐卡7天",
                "imageUrl": "https://cdn.mcdchina.net/gallery/xxx.png",
                "typeText": "权益卡",
                "validDateInfo": "2026.08.20-2026.09.18"
            }
        ],
        "consumePoint": "10",
        "remainPoint": "990",
        "remainChance": 4
    }
}
```

未中奖示例：
``` json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-08-20 15:01:00",
    "traceId": "xxxxxxxxxxxxxxxxxxxx",
    "data": {
        "status": {
            "code": "SUCCESS",
            "message": "成功"
        },
        "win": false,
        "consumePoint": "10",
        "remainPoint": "990",
        "remainChance": 4
    }
}
```

失败示例（活动已结束）：
``` json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-08-20 15:01:00",
    "traceId": "xxxxxxxxxxxxxxxxxxxx",
    "data": {
        "status": {
            "code": "DRAW_FAILED",
            "message": "很抱歉，活动已结束!"
        }
    }
}
```
---
### 4.3.4 查看我的奖品

**工具名：** `query-my-prizes`

**描述：**
> 查询用户中奖记录，支持分页，返回用户在所有积分抽奖活动中获得的全部奖品（不限定某个活动），按中奖时间倒序排列。当用户说："我中了什么奖"、"看看我的奖品"、"我有哪些奖品还没用"时，可以使用该工具查询。

**入参：**

| 参数名 | 类型 | 必填 | 说明 |
|:---:|:---:|:---:|---|
| pageNum | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页大小，默认10，最大20 |

**响应内容：**

示例：
``` json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-08-20 15:02:00",
    "traceId": "xxxxxxxxxxxxxxxxxxxx",
    "data": {
        "status": {
            "code": "SUCCESS",
            "message": "成功"
        },
        "prizes": [
            {
                "id": "6a87011480b56179942cd234",
                "name": "一等奖：早餐卡7天",
                "imageUrl": "https://cdn.mcdchina.net/gallery/xxx.png",
                "prizeType": 2,
                "prizeTypeText": "权益卡",
                "recordTime": "2026-08-20 21:28:52",
                "status": 0,
                "statusText": "可用",
                "timeRemindText": "可用时间: 2026.11.18-2026.12.17",
                "sourceDesc": "奖品来自: 九宫格-dsp3",
                "couponInfo": {
                    "couponCode": "CRD620237035372012363",
                    "couponId": "CRD56514167CEA48B2B9DAB01A96A6ED620"
                }
            }
        ],
        "pageNum": 1
    }
}
```
---

## 4.4 麦麦省领券

### 4.4.1 麦麦省券列表查询

**描述：**
> 查询用户当前可领取的“麦麦省”优惠券列表，返回优惠券名称、图片、状态和促销标签。当用户询问有哪些优惠或可以领取哪些优惠券时，可使用该工具。

**入参：**
> 无需入参

**响应内容：**

示例：
``` markdown
### 麦麦省优惠券列表：
- 优惠券标题：11.9元麦乐鸡 

  状态：已领取 

  优惠券图片：

    <img src="https://img.mcd.cn/cms/images/077b86c9268d33a0.png" height="auto" width="300">
- 优惠券标题：9.9元薯你最甜 

  状态：未领取 

  优惠券图片：

    <img src="https://img.mcd.cn/cms/images/0853e0f8882dc66e.png" height="auto" width="300">
- 优惠券标题：北非蛋风味麦满分 

  状态：不可领取 

  优惠券图片：

    <img src="https://img.mcd.cn/cms/images/6714e5753b475d96.png" height="auto" width="300">
```
### 4.4.2 麦麦省一键领券

**描述：**
> 自动领取“麦麦省”中当前所有可领取的麦当劳优惠券。无需指定具体的优惠券或 `couponId`，系统会自动领取用户可领取的所有优惠券。当用户说“帮我领券”、“自动领取优惠券”或“一键领券”时，可使用该工具。

**入参：**
> 无需入参

**响应内容：**

示例：
``` markdown
### 🎉 领券结果

**总计**: 1 张优惠券
**成功**: 1 张
**失败**: 0 张

---

#### ✅ 成功领取的优惠券：

- **9.9元薯你最甜**
  - couponId：8ED8D8BEBEBDEF26B615682E92EFAC86
  - couponCode：MCDD60T892ST5EV00N1090
  - 图片：<img src="https://img.mcd.cn/cms/images/0853e0f8882dc66e.png" alt="9.9元薯你最甜" height="200" width="auto">
```
### 4.4.3 我的优惠券查询

**描述：**
> 查询我有哪些可用的优惠券。就像打开麦当劳App的"我的优惠券"页面，能看到所有可以用来点餐的优惠券列表。 **包括但不限于使用场景**： - 用户想知道自己有哪些优惠券可以用 - 检查优惠券的有效期和使用条件 - 查看优惠券数量和状态

**入参：**
> 无需入参

**响应内容：**

示例：
``` markdown
# 您的优惠券列表

共 1 张可用优惠券

## 9.9元薯你最甜
- **优惠**: \xa59.9 (用券价格)
- **有效期**: 2025-12-09 00:00-2026-02-12 23:59
- **领取时间**: 今日收到
- **标签**: 到店专用、外送专用

<img src="https://mcd-portal-prod-cos1-1300270282.cos.ap-shanghai.myqcloud.com/campaign/prod/campaign-offer/coupon/66f226e438714697b9f15d1a753d91ba/%E5%A4%A7%E8%96%AF%E6%9D%A1.jpg?sign=q-sign-algorithm%3Dsha1%26q-ak%3DAKIDCD6mEcX25tVrjNxiPvEICas0uXyBKIBs%26q-sign-time%3D1763363214%3B1921043214%26q-key-time%3D1763363214%3B1921043214%26q-header-list%3D%26q-url-param-list%3D%26q-signature%3D59b757fb6a863e8debfcdce8e595bf268d9c0cb9" alt="悟空加价特调免费券0411" height="300" width="auto">

```
---

## 4.5 麦麦商城
### 4.5.1 我的积分查询

**描述：**  
> 查询用户的积分账户信息，包括累计积分、可用积分和过期积分等。当用户询问账户积分情况时，可使用该工具。

**入参：**  
> 无需入参

**响应内容：**

示例：
```json
{
  "success": true,
  "code": 200,
  "message": "请求成功",
  "datetime": "2026-02-09 13:58:34",
  "traceId": "713a18de45735089a3b8a0e8a7cf3e36",
  "data": {
    "availablePoint": "7592",
    "accumulativePoint": "141760.94",
    "currency": "麦当劳积分",
    "currentMouthExpirePoint": "0",
    "expiredPoint": "0",
    "frozenPoint": "30",
    "lastMouthExpirePoint": "0",
    "nextMouthExpirePoint": "0",
    "usedPoint": "115474.14"
  }
}
```
### 4.5.2 查询麦麦商城商品列表

**描述：**
> 查询麦麦商城内可使用积分兑换或现金购买的商品（不包括使用积分兑换的第三方兑换码）。当用户询问麦麦商城有哪些可兑换或购买的商品时，可使用该工具。

**入参：**  
| name | description |
|------|-------------|
| catRuleIds | 用于按商品类目筛选麦麦商城商品，多个值使用逗号分隔，非必填，String 类型。例如，查询商品券和实物商品时，传入 `catRuleIds=1>4,2`。<br>类目规则：商品券（1>4）、实物商品（2）、周边产品（2>8）、实物礼品卡（2>9）、生日类派对（1>6>20）、主题类派对（1>6>21）、麦麦体验营（1>6>22）、品鉴会（1>6>25）、读书会（1>6>34）、积分兑换活动（1>6>40） |

**响应内容：**

示例：
```json
{
  "success": true,
  "code": 200,
  "message": "请求成功",
  "datetime": "2026-02-09 13:59:12",
  "traceId": "43d1d331b103b29bd07a93d441409804",
  "data": [
    {
      "spuName": "中杯拿铁/美式500积分",
      "spuId": 542,
      "spuImage": "https://img.mcd.cn/gallery/b6e0616d94c1f733.png",
      "point": "500",
      "shopId": 2,
      "selling": "",
      "upTime": "2026-02-02 00:00:00",
      "downTime": "2026-04-30 23:59:59",
      "catName":"非预付优惠券",
      "status":2,
      "price":"0"
    }
  ]
}
```
### 4.5.3 查询麦麦商城商品详情

**描述：**  
> 查询商城商品详细信息。当用户想了解某个商品的详细信息（如使用方式、有效期等）时，可以使用此工具。

**入参：**

| name  | description |
|-------|-------------|
| spuId | 用户在商品列表中选择的商品 spuId，表示该商品的 ID，必填，Long 类型 |

**响应内容：**

示例：
```json
{
  "success": true,
  "code": 200,
  "message": "请求成功",
  "datetime": "2026-02-09 14:03:20",
  "traceId": "801b027a09821d95f8a8d26337245ea7",
  "data": {
    "spuName": "中杯拿铁/美式500积分",
    "spuId": 542,
    "images": [
      "https://img.mcd.cn/gallery/b6e0616d94c1f733.png"
    ],
    "shopId": 2,
    "selling": "",
    "note": "note",
    "detail": "detail",
    "upDate": "2026-02-02 00:00:00",
    "downDate": "2026-04-30 23:59:59",
    "skuList": [
      {
        "skuId": 10997,
        "points": "500",
        "extTradePrice": "7",
        "specList": [
          {
            "specMain": "规格名称",
            "specItem": "规格值"
          }
        ]
      }
    ],
    "categoryRuleId": "2>9",
    "spuCategory": "2",
    "partyPeople": "",
    "partyAge": "",
    "partyRange": 120,
    "partyType": 1,
    "spuLimit": {}
  }
}
```
### 4.5.4 积分兑换商品下单

**描述：**  
> 支持用户使用积分兑换虚拟或实物商品，完成积分校验、积分扣减及发券或实物库存扣减。当用户需要使用积分兑换商品时，可使用该工具。

**入参：**  

| name | description |
|------|-------------|
| skuId | 用户在积分兑换商品列表中选择的商品 skuId，表示该商品的具体规格 ID，必填，Long 类型 |
| count | 用户要兑换的优惠券数量，非必填，Integer 类型，默认值为 1 |
| addressId | 配送地址 ID，非必填；`spuCategory="2"` 时必填，String 类型 |
| spuCategory | 商品类别，`"1"` 表示虚拟商品，`"2"` 表示实物商品。需从可兑换餐品券列表或商品详情中获取，String 类型 |

**响应内容：**

示例：
```json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-05-18 17:43:14",
    "traceId": "c3d0683340056b13a2eb8a3bf8aec93b",
    "data": {
        "orderId": "ECS1211037028709736448",
        "orderStatus": 1,
        "status": 1,
        "orderDetailVo": {
            "orderId": "ECS1211037028709736448",
            "orderType": 12,
            "orderStatus": 1,
            "orderStatusTitle": "待支付",
            "orderStatusSubTitle": "内未支付将自动取消订单",
            "leftPaySecond": 899,
            "shopId": 1,
            "shopName": "麦麦商城",
            "channel": "03",
            "channelTag": "APP",
            "goodsTotalPoints": "0",
            "goodsTotalPrice": "0.01",
            "realGoodsTotalPrice": "0.01",
            "realGoodsTotalPoints": "0",
            "realTotalAmount": "0.01",
            "realTotalPoints": "0",
            "goodsDesc": "卡券使用规则详见卡券展示页面",
            "payId": "11976540481989423104",
            "createTime": "2026-05-18 17:43:14",
            "payTransactionId": "",
            "payTime": "2026-05-18 17:43:14",
            "totalAmount": 0,
            "realPayAmount": 0,
            "discountAmount": 0,
            "totalPoints": "0",
            "canInvoice": false,
            "gift": 0,
            "haveRefund": false,
            "newGiftVersion": false,
            "auction": 0,
            "customerServicePhone": "4009-200-205",
            "tag": {
                "name": "APP",
                "color": "FFBC0D"
            },
            "secKill": false,
            "spuMainImg": "",
            "pointShowName": "积分",
            "allCount": 1,
            "receivedCount": 0,
            "giftProgressText": "赠送进度",
            "goods": [
                {
                    "type": 0,
                    "spuId": 465,
                    "skuId": 10863,
                    "spuName": "早餐权益卡",
                    "skuName": "30天",
                    "skuImage": "https://cdn-test.mcdchina.net/ecs/5edd9406f3e63446.jpg",
                    "count": 1,
                    "price": "0.01",
                    "points": "0",
                    "goodsLabels": []
                }
            ],
            "activityGoods": []
        },
        "addressVO": {
            "addressId": "1036456600188036763821193517",
            "contactName": "李",
            "phone": "199****1228",
            "fullAddress": "江苏省南京市江宁区东吉大道1号 江苏软件园一期9栋101"
        }
    }
}
```
### 4.5.5 麦麦商城订单查询

**描述：**  
> 查询麦麦商城内近一年购买或兑换的商品订单。当用户希望查询麦麦商城订单时，可使用该工具。

**入参：**  
| name | description |
|------|-------------|
| lastId | 最后一笔订单的 ID，非必填，Long 类型 |
| size | 每次返回的订单数量，非必填，Integer 类型 |

**响应内容：**

示例：
```json
{
  "success": true,
  "code": 200,
  "message": "请求成功",
  "datetime": "2026-05-18 17:58:01",
  "traceId": "5cff3c2a2081a1aa68175104965cee18",
  "data": [
    {
      "hasNext": true,
      "lastId": 81954,
      "list": [
        {
          "orderId": "ECS1211037028709736448",
          "payId": "11976540481989423104",
          "channel": "03",
          "channelTag": "APP",
          "orderStatus": 1,
          "orderStatusTitle": "待支付",
          "shopId": 1,
          "shopName": "麦麦商城",
          "totalCount": 1,
          "leftPaySecond": 12,
          "goods": [
            {
              "type": 0,
              "spuId": 465,
              "skuId": 10863,
              "spuName": "早餐权益卡",
              "skuName": "30天",
              "skuImage": "https://cdn-test.mcdchina.net/ecs/5edd9406f3e63446.jpg",
              "count": 1,
              "price": "0.01"
            }
          ],
          "source": "1",
          "tag": {
            "name": "APP",
            "color": "FFBC0D"
          },
          "secKill": false,
          "giftType": 0,
          "spuMainImg": "",
          "auction": 0
        }
      ]
    }
  ]
}
```
### 4.5.6 麦麦商城订单详情查询

**描述：**  
> 查询麦麦商城订单的详细信息。当用户想了解某笔订单的支付积分、支付金额或订单状态等信息时，可使用该工具。

**入参：**  
| name | description |
|------|-------------|
| orderId | 订单 ID，必填，String 类型 |

**响应内容：**

示例：
```json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-05-18 18:00:02",
    "traceId": "83b47a170d749905972f3ee2406019c1",
    "data": {
        "orderId": "ECS1211037028709736448",
        "orderType": 12,
        "orderStatus": 40,
        "orderStatusTitle": "已取消",
        "orderStatusSubTitle": "您的订单由于超时未支付被取消",
        "leftPaySecond": 0,
        "shopId": 1,
        "shopName": "麦麦商城",
        "channel": "03",
        "channelTag": "APP",
        "goodsTotalPoints": "0",
        "goodsTotalPrice": "0.01",
        "realGoodsTotalPrice": "0.01",
        "realGoodsTotalPoints": "0",
        "realTotalAmount": "0.01",
        "realTotalPoints": "0",
        "goodsDesc": "卡券使用规则详见卡券展示页面",
        "payId": "11976540481989423104",
        "createTime": "2026-05-18 17:43:14",
        "payTransactionId": "",
        "payTime": "2026-05-18 17:43:14",
        "totalAmount": 0,
        "realPayAmount": 0,
        "discountAmount": 0,
        "totalPoints": "0",
        "canInvoice": false,
        "gift": 0,
        "haveRefund": false,
        "newGiftVersion": false,
        "auction": 0,
        "customerServicePhone": "4009-200-205",
        "tag": {
            "name": "APP",
            "color": "FFBC0D"
        },
        "secKill": false,
        "spuMainImg": "",
        "pointShowName": "积分",
        "allCount": 1,
        "receivedCount": 0,
        "giftProgressText": "赠送进度",
        "goods": [
            {
                "type": 0,
                "spuId": 465,
                "skuId": 10863,
                "spuName": "早餐权益卡",
                "skuName": "30天",
                "skuImage": "https://cdn-test.mcdchina.net/ecs/5edd9406f3e63446.jpg",
                "count": 1,
                "price": "0.01",
                "points": "0",
                "goodsLabels": []
            }
        ],
        "orderPartyInfo": {
          "spuId": 1534,
          "partyId": 11965036,
          "partyStartDateTime": "2026-07-23 11:00:00",
          "partyEndDateTime": "2026-07-23 12:00:00",
          "partyDate": "2026-07-23",
          "storeInfo": {
            "storeName": "南京麦当劳汉中门大街餐厅",
            "storeAddress": "汉中门大街１５１号",
            "storeCode": "1990105"
          },
          "partyTimeStart": "11:00",
          "partyTimeEnd": "12:00",
          "partyType": 1,
          "partyTypeText": "包场",
          "count": 8,
          "remark": "",
          "userPhone": "173****7327",
          "couponRedeemInfoList": [{
            "couponQrCode": "iVBORw0KGgoAAAANSUhEUgAAAaUAAAGlAQAAAAByqdQDAAABWUlEQVR4Xu3YsXbDIBBEUcp0/v+/dOnOCaPFOyxKkTLwppBZNJeSo6S1msf7J8/W+s9bY220r7qBmoPyoDzbKNVGslaoV1BeQXkF5ZXNlWqxUmMCSwWFQqGq0iCKQqFQtXKvlosGhULVLVRmaUwnRQXlFZRXUF7ZWZVMXT8kg/KgPCjPvsrvkSmplrxQFpQH5dlXeVQb0ftYPecHCoX65EilhcCS8mKM11cKCoWKHKnGln6zFo2MRhQKhbqmBbTPIbnKtygU6lqdq6b9a75W45F3kVYoFOp0FdOU+65OR6H6D0o5Vy15dDVWUdMqj5v/B6ugPCgPyrONGlu+P43ulX7brLUyonxE+Yjy8f+qmEbDa3eHoFAo1K2KvRZ/4riPrxQUCoX6DcS9kyPKR5SPKB83Vxmn+eLZgahexFdKBmUIhTpBlaQacaCT+m1TgvKgPCjPJqo//5rXNzeoDbR998d9AAAAAElFTkSuQmCC",
            "hasRedeem": false
          }],
          "voucherText": "凭证",
          "invitationText": "邀请好友参加",
          "navigationText": "餐厅导航",
          "calendarRemindText": "日历提醒",
          "labels": [{
            "name": "生成邀请函",
            "icon": "https://img.mcd.cn/gallery/1144e5076b4401d8.png",
            "code": "INVITE",
            "tipsImg": "https://img.mcd.cn/gallery/39592980cdf6a239.png"
          }],
          "eventTypeText": "活动类型",
          "timeIcon": "https://img.mcd.cn/gallery/03b279735ea8ef23.png",
          "addressIcon": "https://img.mcd.cn/gallery/c6698a25e782b701.png",
          "beCode": ""
        },
        "activityGoods": []
    }
}
```
### 4.5.7 主题活动城市列表查询

**描述：**
> 查询主题活动商品对应的可参与城市列表。当用户想了解某个主题活动可以在哪些城市参与时，可使用该工具。

**入参：**  
| name | description |
|------|-------------|
| spuId | 商品 spuId，必填，Long 类型 |

**响应内容：**

示例：
```json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-07-29 15:10:28",
    "traceId": "18b3364ff1ec7daae0afdaf776f63ae5",
    "data": [
        {
            "code": 320100,
            "latitude": 32.059344,
            "longitude": 118.796624,
            "name": "南京市",
            "initial": "N",
            "sortNo": 212
        }
    ]
}
```
### 4.5.8 主题活动门店列表查询

**描述：**
> 查询主题活动商品对应的可参与门店列表。当用户想了解某个主题活动可以在指定城市的哪些门店参与时，可使用该工具。

**入参：**  
| name | description |
|------|-------------|
| spuId | 商品 spuId，必填，Long 类型 |
| code | 城市 code，必填，String 类型 |
| latitude | 城市纬度，非必填，Double 类型 |
| longitude | 城市经度，非必填，Double 类型 |

**响应内容：**

示例：
```json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-07-29 17:38:11",
    "traceId": "d742832b0f0404891d6d3e0ba347b0b6",
    "data": [
        {
            "address": "南京市珠江路435号",
            "cityCode": "320100",
            "cityName": "南京市",
            "latitude": 32.048459,
            "longitude": 118.797116,
            "name": "南京麦当劳珍珠桥餐厅",
            "shortName": "南京珍珠桥餐厅",
            "code": "1990050",
            "distance": 1210,
            "distanceText": "1.2km",
            "businessStatus": 1,
            "onlineBusinessStatus": true
        }
    ]
}
```
### 4.5.9 主题活动可预约日期查询

**描述：**
> 查询主题活动商品的可预约日期列表。当用户想了解某个主题活动在指定城市和门店有哪些可预约日期时，可使用该工具。

**入参：**  
| name | description |
|------|-------------|
| spuId | 商品 spuId，必填，Long 类型 |
| storeCode | 门店 code，必填，String 类型 |

**响应内容：**

示例：
```json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-07-29 17:40:54",
    "traceId": "d3aaba979908e2655cb6788f96c40f49",
    "data": [
        {
            "date": "2026-07-30",
            "storeCode": "1990050"
        },
        {
            "date": "2026-08-01",
            "storeCode": "1990050"
        }
    ]
}
```
### 4.5.10 主题活动可预约日期场次查询

**描述：**
> 查询主题活动商品的可预约场次列表。当用户想了解某个主题活动在指定城市、门店和日期的可预约场次时，可使用该工具。

**入参：**  
| name | description |
|------|-------------|
| spuId | 商品 spuId，必填，Long 类型 |
| storeCode | 门店 code，必填，String 类型 |
| dateStr | 预约日期，必填，String 类型 |

**响应内容：**

示例：
```json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-07-29 17:44:55",
    "traceId": "6eae480f08cfd93ecb0d11486f38b870",
    "data": [
        {
            "id": 11967196,
            "timeStart": "09:00",
            "timeEnd": "10:00",
            "partyMin": 2,
            "partyMax": 4,
            "price": 1000,
            "cookEmpNo": "",
            "opEmpNo": "",
            "rgmEmpNo": "15958932",
            "leftNum": 4
        }
    ]
}
```
### 4.5.11 主题活动订单创建
**描述：**
> 创建主题活动订单。当用户已选择城市、门店、日期和场次并希望下单时，可使用该工具。

**入参：**  
| name | description |
|------|-------------|
| spuId | 商品 spuId，必填，Long 类型 |
| skuId | 商品 skuId，必填，Long 类型 |
| storeCode | 门店 code，必填，String 类型 |
| dateStr | 预约日期，必填，String 类型 |
| code | 城市 code，必填，String 类型 |
| partyType | 场次类型，必填，Integer 类型 |
| id | 场次 ID，必填，Long 类型 |
| timeStart | 场次开始时间，必填，String 类型 |
| timeEnd | 场次结束时间，必填，String 类型 |
| leftNum | 场次剩余名额，必填，Integer 类型 |
| count | 参与人数，必填，Integer 类型 |

**响应内容：**

示例：
```json
{
    "success": true,
    "code": 200,
    "message": "请求成功",
    "datetime": "2026-07-29 17:53:51",
    "traceId": "595d91e7dde9c35ff6c2dbfa5452f9b7",
    "data": {
        "orderId": "ECS1217560678555496448",
        "orderStatus": 1,
        "status": 1,
        "upgPayId": "111002635081469227008",
        "amount": "250",
        "point": 0,
        "payH5Url": "https://m-uat.mcdchina.net/mcp/scanToPay?orderId=ECS1217560678555496448&orderCategory=ECS",
        "goods": [{
            "spuId": 10522,
            "skuId": 10471,
            "spuName": "迪士尼奇妙生日探索之旅",
            "skuImage": "https://cdn-uat.mcdchina.net/ecs/378959377bfe483a.jpg",
            "count": 5,
            "price": "50",
            "points": "0",
            "extValue": "35FB85E02DCC20082062EE3516004287"
        }]
    }
}
```
---

## 4.6 通用

### 4.6.1 当前时间信息查询工具

**描述：**
> 返回当前服务器的完整时间信息，包括毫秒级时间戳、格式化的日期和时间、年月日信息、时区及 UTC 时间。当无法确定当前时间，或需要根据指定日期查询活动日历时，可使用该工具。

**入参：**
> 无需入参

**响应内容：**

示例：
``` json
{
  "success": true,
  "code": 200,
  "message": "请求成功",
  "datetime": "2025-12-11 17:57:05",
  "traceId": "7b7255e6b4682f35dc0b4df39ffcf02d",
  "data": {
    "timestamp": 1765447025424,
    "datetime": "2025-12-11T17:57:05.424",
    "formatted": "2025-12-11 17:57:05",
    "date": "2025-12-11",
    "year": 2025,
    "month": 12,
    "day": 11,
    "dayOfWeek": "THURSDAY",
    "timezone": "GMT+08:00",
    "offset": "+08:00",
    "utc": "2025-12-11T09:57:05.425Z"
  }
}
```
---

# 5. 版本日志

|    Date    | Version | Description                         |
|:----------:|:-------:|-------------------------------------|
| 2025-12-09 |  1.0.0  | 麦麦日历和麦麦省领券 MCP Server               |
| 2026-01-23 |  1.0.1  | 增加了“餐品营养信息列表”Tool，我们缩短了 URL 以便于大家连接 |
| 2026-02-13 |  1.0.2  | 增加了麦乐送点餐与积分兑换券场景的Tools              |
| 2026-04-02 |  1.0.3  | 增加了到店取餐与团餐场景的Tools              |
| 2026-05-21 |  1.0.4  | 增加了积分兑换实物、商城订单查询等 Tools，并支持得来速车道取餐场景下单及全部点餐场景预约功能              |
| 2026-06-16 |  1.0.5  | 支持更换套餐内商品组合、部分餐品特制              |
| 2026-07-16 |  1.0.6  | 新增历史订单查询工具；支持展示餐品优惠价格；支持随单购买麦金卡和早餐卡              |
| 2026-07-29 |  1.0.7  | 新增麦当劳派对、品鉴会等主题活动查询、预约与下单功能              |
| 2026-08-27 |  1.0.8  | 新增积分抽奖工具：查看活动信息、抽奖、查我的奖品              |
| 2026-09-10 |  1.0.9  | 新增取消订单、餐具选择、麦乐送订单备注功能；堂食外带场景下支持返回取餐柜二维码             |
');n(e.toString())})()},[]);Object(d.useEffect)(()=>{e&&((()=>{if(!m.current)return;const e=m.current.querySelectorAll("h1, h2, h3, h4"),n=Array.from(e).map((e,n)=>{var t,r;return{id:e.id,text:null!==(t=null===(r=e.textContent)||void 0===r?void 0:r.replace("#","").trim())&&void 0!==t?t:"",level:parseInt(e.tagName.charAt(1)),element:e,index:n}}).reduce((e,n)=>(ol(e,n),e),[]);r(n)})(),v())},[e]);const v=()=>{if(!m.current)return;m.current.querySelectorAll("pre").forEach(e=>{if(e.querySelector(".code-copy-btn"))return;const n=document.createElement("button");n.className="code-copy-btn";const t='<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11.5 1H4.5C3.95 1 3.5 1.45 3.5 2V10C3.5 10.55 3.95 11 4.5 11H11.5C12.05 11 12.5 10.55 12.5 10V2C12.5 1.45 12.05 1 11.5 1ZM11.5 10H4.5V2H11.5V10ZM1.5 4V12C1.5 12.55 1.95 13 2.5 13H10.5V12H2.5V4H1.5Z" fill="currentColor"/></svg><span>复制</span>';n.innerHTML=t,n.addEventListener("click",()=>{const r=e.querySelector("code"),o=r?r.textContent||"":e.textContent||"";navigator.clipboard.writeText(o).then(()=>{n.innerHTML='<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.5 9.5L2.5 6.5L1.8 7.2L5.5 10.9L12.5 3.9L11.8 3.2L5.5 9.5Z" fill="currentColor"/></svg><span>已复制</span>',n.classList.add("copied"),setTimeout(()=>{n.innerHTML=t,n.classList.remove("copied")},1500)})}),e.insertBefore(n,e.firstChild)})},y=Object(d.useMemo)(()=>b()(()=>{if(!m.current||0===t.length||g.current)return;const e=[],n=t=>{for(let r=t.length-1;r>=0;r--){const o=t[r];if(o.children&&(n(o.children),e.length>0)){e.unshift(o.id);break}const i=o.element.getBoundingClientRect().top;if(i>0&&i<.8*window.innerHeight){e.unshift(o.id);break}}};n(t),i(n=>(0===n.length&&0===e.length&&e.push(t[0].id),e.length>0?e:n))},100),[t]);Object(d.useEffect)(()=>(window.addEventListener("scroll",y),setTimeout(()=>{y()},300),()=>{window.removeEventListener("scroll",y)}),[y]);const k=e=>{i(e),(e=>{const n=document.getElementById(e);if(n){g.current=!0;const e=n.getBoundingClientRect().top+window.pageYOffset-112;window.scrollTo({top:e}),setTimeout(()=>{g.current=!1},100)}})(e[e.length-1]),x&&p(!1)},E=()=>{p(!a)};return Object(d.useEffect)(()=>(document.body.style.overflow=x&&a?"hidden":"",()=>{document.body.style.overflow=""}),[x,a]),Object(nl.jsx)(Ip.a,{children:n=>{let{loginStatus:r,openServiceStateModal:i}=n;return Object(nl.jsxs)("div",{className:h()("markdown-layout",{"sidebar-visible":a}),children:[Object(nl.jsx)(Mp.a,{loginStatus:r,onServiceEntryClick:i,initTabIndex:1}),x&&Object(nl.jsxs)("button",{className:"sidebar-toggle",onClick:E,"aria-label":"Toggle navigation",children:[Object(nl.jsx)("svg",{width:"14",height:"14",viewBox:"0 0 20 20",fill:"none",children:Object(nl.jsx)("path",{d:"M3 4h14M3 10h14M3 16h14",stroke:"#fff",strokeWidth:"1.5",strokeLinecap:"round"})}),Object(nl.jsx)("span",{children:"目录"})]}),x&&a&&Object(nl.jsx)("div",{className:"sidebar-overlay",onClick:()=>p(!1)}),Object(nl.jsxs)("aside",{className:h()("sidebar",{open:a}),children:[Object(nl.jsx)("div",{className:"head",children:"文档导航"}),Object(nl.jsx)("nav",{className:"nav",children:Object(nl.jsx)("div",{className:"content",children:t.map((e,n)=>Object(nl.jsx)(rl,{data:e,highlightIds:o,onClick:k},n))})}),Object(nl.jsx)("div",{className:"foot"})]}),Object(nl.jsx)("div",{className:h()("copy-actions",{mobile:x,expanded:c}),children:c?Object(nl.jsxs)(nl.Fragment,{children:[Object(nl.jsxs)("button",{className:h()("copy-btn",{copied:"md"===s}),onClick:()=>w("md",()=>fetch("/mcp/guide.md").then(e=>e.text())),children:[Object(nl.jsx)("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",children:Object(nl.jsx)("path",{d:"M11.5 1H4.5C3.95 1 3.5 1.45 3.5 2V10C3.5 10.55 3.95 11 4.5 11H11.5C12.05 11 12.5 10.55 12.5 10V2C12.5 1.45 12.05 1 11.5 1ZM11.5 10H4.5V2H11.5V10ZM1.5 4V12C1.5 12.55 1.95 13 2.5 13H10.5V12H2.5V4H1.5Z",fill:"currentColor"})}),"md"===s?"已复制":"Markdown"]}),Object(nl.jsxs)("button",{className:h()("copy-btn",{copied:"url"===s}),onClick:()=>w("url",()=>Promise.resolve(`${window.location.origin}/mcp/guide.md`)),children:[Object(nl.jsx)("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",children:Object(nl.jsx)("path",{d:"M11.5 1H4.5C3.95 1 3.5 1.45 3.5 2V10C3.5 10.55 3.95 11 4.5 11H11.5C12.05 11 12.5 10.55 12.5 10V2C12.5 1.45 12.05 1 11.5 1ZM11.5 10H4.5V2H11.5V10ZM1.5 4V12C1.5 12.55 1.95 13 2.5 13H10.5V12H2.5V4H1.5Z",fill:"currentColor"})}),"url"===s?"已复制":"URL"]}),Object(nl.jsx)("button",{className:"copy-btn copy-close",onClick:()=>u(!1),children:"✕"})]}):Object(nl.jsxs)("button",{className:"copy-btn",onClick:()=>u(!0),children:[Object(nl.jsx)("svg",{width:"14",height:"14",viewBox:"0 0 14 14",fill:"none",children:Object(nl.jsx)("path",{d:"M11.5 1H4.5C3.95 1 3.5 1.45 3.5 2V10C3.5 10.55 3.95 11 4.5 11H11.5C12.05 11 12.5 10.55 12.5 10V2C12.5 1.45 12.05 1 11.5 1ZM11.5 10H4.5V2H11.5V10ZM1.5 4V12C1.5 12.55 1.95 13 2.5 13H10.5V12H2.5V4H1.5Z",fill:"currentColor"})}),"复制"]})}),Object(nl.jsx)("main",{className:"markdown-content",ref:m,children:Object(nl.jsx)("div",{dangerouslySetInnerHTML:{__html:e}})}),Object(nl.jsx)(Bp.a,{className:"footer"})]})}})};var al=()=>Object(nl.jsx)(f.a,{locale:c.a,prefixCls:"pfe",children:Object(nl.jsx)(s.a,{children:Object(nl.jsx)(il,{})})});t(305),t(306),t(448);p.a.config({rootPrefixCls:"pfe"}),l.a.config({prefixCls:"pfe-message"}),a.a.render(Object(nl.jsx)(al,{}),document.getElementById("root"))}],[[442,8,0,1]]]);
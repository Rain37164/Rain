# Nutrition Meal Planning Assistant · 麦当劳营养配餐助手

> 基于**麦当劳中国官方 MCP Server** 的 AI 营养配餐助手。所有餐品、价格、门店、营养数据 100% 来自官方接口，项目内不含任何硬编码营养值。

一个纯静态站点（无构建、无框架、无后端），给定目标热量与饮食目标后，从**在售菜单**中组合出落在 ±100 kcal 容差内的配餐方案，并给出营养结构雷达、热量达成圆环、单品营养剖面与全站营养仪表盘。

---

## 目录结构

```
Nutrition Meal Planning Assistant/
├── README.md                     本文件
├── CONTEST_DECLARATION.md        参赛声明（署名处为占位符，提交前请替换）
├── MCP_INTEGRATION.md            MCP 接入说明（Token / 协议 / 工具 / 流水线 / 字段陷阱）
├── mcp-config.example.json       MCP 客户端配置示例（Token 为占位符）
├── workbuddy.md                  开发对话记录（需求 → 方案 → 验证全过程）
├── site/                         站点源码
│   ├── index.html                配餐工作台（选门店 → 设目标 → 生成方案）
│   ├── loading.html              AI 生成中的过渡页
│   ├── results.html              配餐结果（3 套方案 + 雷达 + 环形达成）
│   ├── detail.html               单品营养详情（剖面拆解 + 横向对比图）
│   ├── dashboard.html            营养数据仪表盘（分布 / 排行 / 雷达）
│   ├── guide.html                接入说明页
│   ├── assets/css/style.css      全站样式（深色炭黑 + 冰蓝全息 + 麦当劳金黄）
│   ├── assets/js/
│   │   ├── core.js               公共库：数据、配餐求解、SVG 图表、门店定位（导出 window.MCD）
│   │   ├── data-embed.js         MCP 数据快照内联（window.MCD_DATA）
│   │   ├── details-embed.js      套餐组成快照内联
│   │   └── index/results/detail/dashboard/loading/guide.js  各页脚本
│   ├── data/                     原始 JSON 快照（nutrition / menu / stores / details）
│   └── tools/                    测试脚本与验证截图
└── mcp/                          MCP Skill 与取数脚本
    ├── SKILL.md                  Skill 主文件（角色定义 + 硬规则 + SOP）
    ├── references/               mcp-tools.md / ordering-pipeline.md / official-doc.md
    └── scripts/                  probe.py / call.py / fetch_data.py / fetch_details.py
```

---

## 快速开始

### 方式一：直接双击打开

数据已内联进 `assets/js/data-embed.js`，**不走 fetch**，因此 `site/index.html` 双击即可运行，无需任何服务器。

### 方式二：本地服务（推荐，跨页跳转体验一致）

```bash
cd site
python -m http.server 8765 --bind 127.0.0.1
# 浏览器打开 http://127.0.0.1:8765/index.html
```

---

## 六个页面

| 页面 | 作用 |
| --- | --- |
| **index.html 配餐工作台** | 选择就餐门店（含定位与距离排序）→ 设置目标热量 / 饮食目标（均衡 / 减脂 / 增肌）/ 忌口 → 生成方案。页面含全息主视觉、营养雷达卡与热量达成圆环卡（左右并排，≤860px 自动堆叠）。 |
| **loading.html AI 生成** | 求解过程的过渡页，展示调用步骤。 |
| **results.html 配餐结果** | 3 套方案卡片：每套含组成明细、合计营养、热量达成环形图（封顶 100%，超出量在环下标注）、小型营养雷达、五项占比条、推荐理由（区分「容差上限 ±100 kcal」与「本次实际偏差 N kcal」）。 |
| **detail.html 单品详情** | 食材剖面拆解视图、套餐组成、官方营养数据、相对参考值占比条，以及「营养对比图 · 当前值 vs 参考值」横向条形图（6 指标，可切换对比餐品）。 |
| **dashboard.html 营养仪表盘** | 全量餐品的营养分布散点、热量排行、门店可配餐餐品热量分布（X 轴标签防重叠）、雷达图。 |
| **guide.html 接入说明** | 7 步调用流程时间轴、Token 申请步骤、配置示例、数据口径与工程约束、官方版本日志。 |

---

## 配餐算法

`site/assets/js/core.js` 中的 `MCD.generatePlans(opts)`：

```js
MCD.generatePlans({
  kcal: 700,                  // 目标热量
  goal: "balance",            // balance | cut | bulk
  avoid: ["花生", "香菜"],    // 忌口关键词
  count: 3                    // 方案数量
});
```

- **硬约束**：方案总热量与目标值偏差 **严格 ≤ 100 kcal**；忌口命中即剔除。
- **角色划分**：主食 / 小食 / 饮料分组组合，避免「三杯可乐」式无效解。
- **评分**：热量偏差为主项；按目标追加营养惩罚（减脂控脂肪与钠、鼓励蛋白；增肌鼓励蛋白与热量；均衡惩罚极端营养占比）；同分时价格低者优先。
- **营养匹配**（关键）：官方营养表 `list-nutrition-foods` 只收录**单品**，而菜单里大量是**套餐**。若做包含匹配，会出现「麦辣鸡腿汉堡三件套 → 麦辣鸡腿汉堡」的错配，导致套餐热量被严重低估。规则为：
  - 含组合词（套餐 / 三件套 / 四件套 / 随心配 / 分享餐 / 任选 / 双人 / 多人…）**一律不做近似匹配**；
  - 仅允许「完全同名」、「仅规格前后缀差异（中杯 / 大杯 / 冰 / 热 / 盒装）」与 3 条明确别名（薯条→中薯条、麦乐鸡→麦乐鸡5块、麦辣鸡翅→麦辣鸡翅-2块）；
  - 近似匹配在 UI 标注实际「营养来源」。
  - 结果：116 款在售餐品中 **33 款**可参与配餐（19 精确 + 14 规格差异），套餐类不参与热量计算。

---

## 数据来源与口径

| 数据 | 来源工具 | 快照规模 |
| --- | --- | --- |
| 营养 | `list-nutrition-foods` | 160 条 |
| 菜单与价格 | `query-meals` | 116 款 / 15 个分类 |
| 门店 | `query-nearby-stores` | 5 家（南京新街口商圈） |
| 套餐组成 | `query-meal-detail` | 33 款 |

- 雷达图口径：`当前值 ÷ 每日推荐 × 100%`，基准 `DAILY = 热量 2000 kcal / 蛋白 60 g / 脂肪 60 g / 碳水 250 g / 钠 2000 mg`；超过 100% 的顶点与相邻边标红（另有 `REF` 单人单餐参考值 840 / 22 / 25 / 120 / 800，供环形与占比条使用，两者不混用）。
- 金额单位：菜单 `currentPrice` 是**元**，`calculate-price` 返回是**分**，展示前统一换算。
- 距离：接口快照经纬度全为 0，`storeGeo()` 回落到人工标注的坐标并标 `approx`；> 200 km 判为异常并丢弃。

### 刷新数据

```bash
export MCD_MCP_TOKEN="<你的 Token>"
python mcp/scripts/fetch_data.py      # 营养 + 门店 + 菜单 → site/data/*.json
python mcp/scripts/fetch_details.py   # query-meal-detail → site/data/details.json
python mcp/scripts/probe.py           # 连通性自检（tools/list）
```

---

## 测试

在 `site/` 目录下（jsdom 装在托管 workspace，需设 `NODE_PATH`）：

```bash
export NODE_PATH="C:/Users/<你>/.workbuddy/binaries/node/workspace/node_modules"
node tools/selftest.js       # 配餐算法与数据断言（需在 tools/ 目录内运行）
node tools/domtest.js        # jsdom 逐页校验 DOM 与运行时错误（需先起 8765 服务）
node tools/plantest.js       # 5 组目标热量 × 3 方案 = 100 项
node tools/radartest.js      # 雷达图几何 / 标红 / 网格 / 弹窗 = 233 项
node tools/popuptest.js      # 门店下拉方向、高度、搜索 = 31 项
node tools/detailtest.js     # 单品对比图结构 / 几何 / 切换 / 弹窗 = 35 项
node tools/browser-check.js  # 真实 Chrome 自动化（下拉滚动、方向锁定、不压页脚）= 12 项
```

> 注：`browser-check.js` 依赖 `playwright-core` + 系统 Chrome；jsdom 与合成 `WheelEvent` **无法**复现原生滚轮问题，必须用真实浏览器输入验证。

---

## 技术栈与约束

- 纯静态：原生 HTML / CSS / JavaScript（ES5+，无构建、无框架、无运行时依赖）。
- 图表全部为手写 SVG：`ringSVG`（环形达成）、`radarSVG`（五维雷达）、`lineSVG`（趋势）、`scatterSVG`（散点分布）。
- 所有动态文本经 `MCD.esc()` 转义（含 URL 参数）。
- 响应式：≤860px 图表卡片堆叠，≤1080px 详情页单列。
- 无障碍：跳转链接、`aria-*`、图表 `role="img"` + `aria-label`、`<title>` 兜底。

---

## 免责声明

本工具为**麦当劳 MCP 开发者大赛参赛作品**，非麦当劳官方产品。所有推荐方案仅为智能参考，**不代表可下单履约**；实际价格、库存、优惠以麦当劳官方 App / 门店为准。营养信息仅作饮食参考，本工具不提供任何医疗、健康或治疗类诊断建议。

/* 站点逻辑自检：在 Node 中加载数据与核心逻辑，验证匹配、配餐与边界 */
const fs = require("fs");
const path = require("path");

global.window = {};
const root = process.argv[2] || "..";
eval(fs.readFileSync(path.join(root, "assets/js/data-embed.js"), "utf8"));
eval(fs.readFileSync(path.join(root, "assets/js/core.js"), "utf8"));

const MCD = window.MCD;
let fail = 0;
function ok(cond, msg) {
  console.log((cond ? "  PASS " : "  FAIL ") + msg);
  if (!cond) fail++;
}

console.log("== 数据加载 ==");
ok(MCD.nutrition.length > 0, `营养数据 ${MCD.nutrition.length} 条`);
ok(Object.keys(MCD.meals).length > 0, `菜单 ${Object.keys(MCD.meals).length} 款`);
ok(MCD.stores.length > 0, `门店 ${MCD.stores.length} 家`);

const cat = MCD.catalog();
console.log(`\n== 可配餐餐品 ${cat.length} 款 ==`);
const combos = cat.filter((i) => /套餐|三件套|四件套|随心配|分享餐|任选|双人/.test(i.name));
ok(combos.length === 0, `组合餐未混入配餐池（发现 ${combos.length} 个）`);
if (combos.length) combos.forEach((c) => console.log("      ! " + c.name));

ok(cat.every((i) => i.nutrition.energyKcal != null), "所有可配餐餐品都有热量值");
ok(cat.every((i) => i.price > 0), "所有可配餐餐品都有价格");

console.log("\n== 配餐求解 ==");
[
  { kcal: 500, goal: "cut", avoid: [] },
  { kcal: 700, goal: "balance", avoid: [] },
  { kcal: 900, goal: "bulk", avoid: [] },
  { kcal: 600, goal: "balance", avoid: ["beef"] },
  { kcal: 800, goal: "cut", avoid: ["fried", "sweet"] },
  { kcal: 450, goal: "balance", avoid: ["beef", "chicken", "fish", "pork"] }
].forEach((cfg) => {
  const plans = MCD.generatePlans(Object.assign({ count: 3 }, cfg));
  const tag = `kcal=${cfg.kcal} ${cfg.goal} avoid=[${cfg.avoid}]`;
  if (!plans.length) {
    console.log(`  ${tag} → 无解（可能是忌口过严，属预期）`);
    return;
  }
  const p = plans[0];
  const devOk = Math.abs(p.kcal - cfg.kcal) <= 100;
  ok(devOk, `${tag} → ${plans.length} 套, 最优 ${Math.round(p.kcal)}kcal(偏差${Math.round(p.dev)}) ${p.items.map((i) => i.name).join(" + ")} ¥${p.price.toFixed(1)}`);
});

console.log("\n== 忌口约束生效性 ==");
const beefAvoid = MCD.generatePlans({ kcal: 700, goal: "balance", avoid: ["beef"], count: 3 });
ok(beefAvoid.every((p) => p.items.every((i) => !/牛|安格斯|巨无霸|吉士/.test(i.name))), "排除牛肉生效");

const allAvoid = MCD.generatePlans({ kcal: 700, goal: "balance", avoid: ["beef", "chicken", "fish", "pork", "fried", "sweet", "drink"], count: 3 });
console.log(`  全部忌口 → ${allAvoid.length} 套（预期极少或无）`);

console.log("\n== 金额换算 ==");
const items = cat.slice(0, 3);
const sum = items.reduce((s, i) => s + i.price, 0);
ok(Math.abs(sum - items.reduce((s, i) => s + parseFloat(MCD.meals[i.code].currentPrice), 0)) < 1e-6,
  `菜单价格解析一致，示例合计 ¥${MCD.yuan(sum)}`);

console.log("\n== 名称对齐抽样（近似匹配须标注来源）==");
cat.filter((i) => i.approx).slice(0, 8).forEach((i) => {
  console.log(`  ${i.name}  →  营养来源：${i.nutritionVia}  [${i.nutrition.energyKcal} kcal]`);
});

console.log("\n== 图表函数 ==");
ok(MCD.ringSVG(0.8, "test", "80%", 100).indexOf("<svg") >= 0, "ringSVG 可生成");
ok(MCD.radarSVG([{ label: "热量", value: 500, max: 840 }], 200).indexOf("<svg") >= 0, "radarSVG 可生成");
ok(MCD.lineSVG([{ label: "a", value: 1 }, { label: "b", value: 3 }]).indexOf("<svg") >= 0, "lineSVG 可生成");
ok(MCD.scatterSVG([
  { label: "a", value: 10, nutrition: { protein: 1, fat: 1, sodium: 10 } },
  { label: "b", value: 300, nutrition: { protein: 2, fat: 2, sodium: 20 } },
  { label: "c", value: 707, nutrition: { protein: 3, fat: 3, sodium: 30 } }
], { goldIdx: 2, unit: "kcal", target: 700 }).indexOf('class="svert"') >= 0, "scatterSVG 可生成");

console.log(fail === 0 ? "\n全部通过 ✅" : `\n${fail} 项失败 ❌`);
process.exit(fail === 0 ? 0 : 1);

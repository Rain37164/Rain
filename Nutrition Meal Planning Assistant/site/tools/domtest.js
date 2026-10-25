/* DOM 执行验证：用 jsdom 真实加载每个页面并执行脚本，捕获运行时错误并检查渲染结果 */
const { JSDOM, VirtualConsole } = require("jsdom");

const BASE = process.argv[2] || "http://127.0.0.1:8765";
const PAGES = [
  { file: "index.html", checks: [["#nav .nav-in", "导航"], ["#foot .in", "页脚"], ["#homeMetrics .metric", "概览指标"], ["#kcalRing svg", "环形图"], ["#homeRadar svg", "雷达图"], ["#homePlan .pick, #homePlan .empty", "AI 结果卡"], ["#storeList .store-opt", "门店列表"], ["#storeBtn", "门店选择框"], ["#storeRefresh", "定位刷新按钮"]] },
  { file: "results.html?kcal=700&goal=balance", checks: [["#nav .nav-in", "导航"], ["#plans .plan, #plans .empty", "方案列表"], ["#catTable tbody tr", "餐品表"], ["#planCount", "方案计数"], ["#plans .plan-extra svg", "方案营养雷达"], ["#plans .pe-bars li", "占比条"], ["#plans .ring-note", "环形说明"]] },
  { file: "detail.html", checks: [["#nav .nav-in", "导航"], ["#nutMetrics .metric", "营养指标"], ["#bars .layer", "占比条"], ["#peers .meal-card", "同类对比"], ["#mealName", "餐品名"]] },
  { file: "dashboard.html", checks: [["#topMetrics .metric", "顶部指标"], ["#bigRing svg", "环形"], ["#bigRadar svg", "雷达"], ["#distScatter svg", "分布散点"], ["#distScatter .svert", "散点"], ["#gaps .layer", "缺口提示"], ["#catTable tbody tr", "品类表"], ["#topMeals .meal-card", "高热列表"]] },
  { file: "loading.html?kcal=700&goal=balance", checks: [["#liveMetrics .metric", "实时指标"], ["#bar", "进度条"], ["svg .trace", "流光"]] },
  { file: "guide.html", checks: [["#nav .nav-in", "导航"], ["#verBody tr", "版本日志"], ["#nCount", "营养计数"], ["#mCount", "菜单计数"], ["svg .trace", "时间轴流光"]] }
];

let failures = 0;
const errors = [];

(async () => {
  for (const p of PAGES) {
    const vc = new VirtualConsole();
    vc.on("jsdomError", (e) => {
      const m = String(e && e.message || e);
      if (/navigation|Not implemented/i.test(m)) return; // loading 页跳转属预期
      errors.push(`${p.file}: ${m}`);
    });
    vc.on("error", (...a) => errors.push(`${p.file}: console.error ${a.join(" ")}`));

    const dom = await JSDOM.fromURL(`${BASE}/${p.file}`, {
      runScripts: "dangerously",
      resources: "usable",
      pretendToBeVisual: true,
      virtualConsole: vc
    });
    await new Promise((r) => setTimeout(r, 900));
    const d = dom.window.document;

    const results = p.checks.map(([sel, label]) => {
      const n = d.querySelectorAll(sel).length;
      return { label, sel, n, ok: n > 0 };
    });
    const bad = results.filter((r) => !r.ok);
    failures += bad.length;

    console.log(`\n${bad.length ? "✗" : "✓"} ${p.file}`);
    results.forEach((r) => console.log(`    ${r.ok ? "ok  " : "MISS"} ${r.label.padEnd(10)} ${r.sel}${r.ok ? " ×" + r.n : ""}`));
    // 抽样展示渲染文本
    const sample = d.querySelector("#planCount, #mealName, #nCount, #topMetrics .metric .v");
    if (sample) console.log(`    样本文本: ${sample.textContent.trim().slice(0, 80)}`);
    dom.window.close();
  }

  console.log("\n==================");
  if (errors.length) {
    console.log("运行时错误:");
    errors.slice(0, 12).forEach((e) => console.log("  ! " + e));
    failures += errors.length;
  } else {
    console.log("无运行时错误 ✅");
  }
  console.log(failures === 0 ? "DOM 验证全部通过 ✅" : `失败 ${failures} 项 ❌`);
  process.exit(failures === 0 ? 0 : 1);
})();

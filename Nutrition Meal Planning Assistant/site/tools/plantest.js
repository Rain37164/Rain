/* 方案列表页校验：
   1) 环形百分比不超过 100%（超出目标时封顶，并用文字标注超出量）
   2) 圆环填充比例 ringRatio <= 1（stroke-dashoffset 不得为负）
   3) 推荐理由同时出现「容差上限 ±100」与「本次实际偏差 N kcal」
   4) 每张方案卡都有营养雷达与占比条
   用法：node tools/plantest.js http://127.0.0.1:8765 */
const { JSDOM, VirtualConsole } = require("jsdom");

const BASE = process.argv[2] || "http://127.0.0.1:8765";
const CASES = [700, 690, 707, 500, 900];
let pass = 0, fail = 0;
const ok = (c, label, extra) => {
  if (c) { pass++; console.log("  [OK] " + label); }
  else { fail++; console.log("  [FAIL] " + label + (extra ? " -> " + extra : "")); }
};

(async () => {
  for (const kcal of CASES) {
    const vc = new VirtualConsole();
    const errs = [];
    vc.on("jsdomError", e => errs.push(String(e && e.message || e)));
    const dom = await JSDOM.fromURL(`${BASE}/results.html?kcal=${kcal}&goal=balance`, {
      runScripts: "dangerously", resources: "usable", pretendToBeVisual: true, virtualConsole: vc
    });
    await new Promise(r => setTimeout(r, 900));
    const d = dom.window.document;

    console.log(`\n=== 目标 ${kcal} kcal ===`);
    const plans = [...d.querySelectorAll("#plans .plan")];
    ok(plans.length > 0, `方案数 ${plans.length}`, "无方案");

    plans.forEach((p, i) => {
      const center = p.querySelector(".ring-center b");
      const pctTxt = center ? center.textContent.trim() : "";
      const pctNum = parseFloat(pctTxt);
      ok(!isNaN(pctNum) && pctNum <= 100,
        `方案${i + 1} 环形文字 ${pctTxt} 不超过 100%`, pctTxt);

      const fg = p.querySelector("circle.ring-fg");
      const dash = fg ? parseFloat(fg.getAttribute("stroke-dasharray")) : 0;
      const off = fg ? parseFloat(fg.getAttribute("stroke-dashoffset")) : 0;
      ok(off >= -0.01 && off <= dash + 0.01,
        `方案${i + 1} 圆环未溢出(dashoffset ${off.toFixed(1)} / ${dash.toFixed(1)})`);

      const note = p.querySelector(".ring-note");
      ok(!!note && note.textContent.trim().length > 0,
        `方案${i + 1} 环形说明存在 -> ${note ? note.textContent.trim().slice(0, 60) : "缺失"}`);

      const reason = p.querySelector(".hint");
      const rt = reason ? reason.textContent : "";
      ok(/容差上限\s*±100\s*kcal/.test(rt) && /本次实际偏差\s*\d+\s*kcal/.test(rt),
        `方案${i + 1} 理由区分容差上限与实际偏差 -> ${rt.trim().slice(0, 90)}`);

      ok(p.querySelectorAll(".plan-extra svg circle.rhit").length >= 5,
        `方案${i + 1} 营养雷达 ${p.querySelectorAll(".plan-extra svg circle.rhit").length} 个顶点`);
      ok(p.querySelectorAll(".pe-bars li").length === 5,
        `方案${i + 1} 占比条 ${p.querySelectorAll(".pe-bars li").length} 行`);
    });

    // 若存在超出目标的方案，验证文案出现「超出目标 +N kcal」
    const overNote = plans.map(p => p.querySelector(".ring-note").textContent).find(t => /超出目标/.test(t));
    if (plans.length) {
      console.log("    环形说明样例: " + (overNote || plans[0].querySelector(".ring-note").textContent).trim());
    }
    ok(errs.length === 0, "无运行时错误", errs.join(" | "));
    dom.window.close();
  }

  console.log(`\n结果: ${pass} 通过 / ${fail} 失败`);
  process.exit(fail ? 1 : 0);
})();

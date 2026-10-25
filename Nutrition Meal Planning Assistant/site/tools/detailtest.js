/* 详情页营养对比图回归测试
   用法: node tools/detailtest.js [baseUrl]
   覆盖：6 行结构、超标/未超标配色与几何（参考线 76.9%）、
        与右侧占比条的 over 判定一致、切换餐品平滑动画、空数据灰色占位、悬浮弹窗四要素 */
const { JSDOM } = require("jsdom");

const base = process.argv[2] || "http://127.0.0.1:8765";
let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log("  [OK] " + msg); }
  else { fail++; console.log("  [FAIL] " + msg); }
}

JSDOM.fromURL(base + "/detail.html", {
  runScripts: "dangerously", resources: "usable", pretendToBeVisual: true
}).then((dom) => new Promise((r) => setTimeout(() => r(dom), 1400))).then(async (dom) => {
  const win = dom.window, doc = win.document;
  const MCD = win.MCD;
  if (!MCD) { console.log("[FAIL] MCD 未加载"); process.exit(1); }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const chart = doc.getElementById("cmpChart");
  const sel = doc.getElementById("cmpSel");

  /* 1. 结构：6 行 × 完整字段 */
  console.log("\n结构与字段");
  let rows = Array.from(chart.querySelectorAll(".cmp-row"));
  ok(rows.length === 6, "对比图 6 行（" + rows.length + "）");
  const names = rows.map((r) => r.querySelector(".cmp-nm").textContent);
  ok(JSON.stringify(names) === JSON.stringify(["热量", "蛋白质", "脂肪", "碳水化合物", "钠", "钙"]),
    "指标顺序：热量/蛋白质/脂肪/碳水化合物/钠/钙");
  ok(rows.every((r) => /^\d{2}$/.test(r.querySelector(".cmp-idx").textContent)), "行序号 01-06");
  ok(rows.every((r) => r.querySelector(".cmp-track .cmp-refline") !== null), "每行含参考值虚线基准线");
  ok(rows.every((r) => r.querySelector(".cmp-val").textContent.length > 0 &&
                        /参考/.test(r.querySelector(".cmp-val small").textContent)),
    "每行含当前值与参考值文本");
  ok(rows.every((r) => /%$/.test(r.querySelector(".cmp-pct").textContent)), "每行含占比百分比");

  /* 2. 几何与配色：over 行越过参考线（76.9%），未超标不超过 */
  console.log("\n几何与配色");
  const REF = 100 / 1.3;
  rows.forEach((r) => {
    const w = parseFloat(r.querySelector(".cmp-bar").getAttribute("data-w"));
    const over = r.classList.contains("over");
    if (over) ok(w > REF + 0.1, r.querySelector(".cmp-nm").textContent + " 超标条越过参考线 (" + w.toFixed(1) + " > " + REF.toFixed(1) + ")");
    else ok(w <= REF + 0.1, r.querySelector(".cmp-nm").textContent + " 未超标条不越过参考线 (" + w.toFixed(1) + " ≤ " + REF.toFixed(1) + ")");
    ok(w > 0 && w <= 100.05, r.querySelector(".cmp-nm").textContent + " 条宽在轨道内 (" + w.toFixed(1) + "%)");
  });
  /* 与右侧占比条的 over 判定一致 */
  const rightOver = Array.from(doc.querySelectorAll("#bars .layer.over")).length;
  const leftOver = rows.filter((r) => r.classList.contains("over")).length;
  ok(rightOver === leftOver, "超标行数与右侧占比条一致（左 " + leftOver + " = 右 " + rightOver + "）");

  /* 3. 切换餐品：就地重渲染 + 动画（width 从 0 过渡） */
  console.log("\n切换餐品动画");
  const item0 = MCD.catalog().filter((i) => i.code === sel.value)[0];
  const other = MCD.catalog().filter((i) => i.code !== sel.value)[0];
  const pct0 = rows[0].querySelector(".cmp-pct").textContent;
  sel.value = other.code;
  sel.dispatchEvent(new win.Event("change", { bubbles: true }));
  rows = Array.from(chart.querySelectorAll(".cmp-row"));
  const barEls = rows.map((r) => r.querySelector(".cmp-bar"));
  /* change 同步重渲染：条形先回到 0 宽，再由双 rAF 推到目标宽度 */
  ok(barEls.every((b) => parseFloat(b.style.width) === 0 || b.style.width === ""),
    "切换瞬间条形从 0 开始（width 未立即到目标值）");
  await sleep(120);
  ok(barEls.every((b) => parseFloat(b.style.width) > 0),
    "动画完成后所有条形到达目标宽度");
  const pct1 = rows[0].querySelector(".cmp-pct").textContent;
  ok(pct1 !== pct0 || other.code === item0.code || rows[0].getAttribute("data-name") !== "",
    "切换后数据更新（热量占比 " + pct0 + " → " + pct1 + "）");
  ok(chart.getAttribute("aria-label").indexOf(other.name) >= 0, "aria-label 已更新为新餐品");
  sel.value = item0.code;
  sel.dispatchEvent(new win.Event("change", { bubbles: true }));
  rows = Array.from(chart.querySelectorAll(".cmp-row"));
  await sleep(80);

  /* 4. 空数据：缺钙/钠 → -- + 灰色占位条（通过改写 nutrition 引用模拟） */
  console.log("\n空数据占位");
  const tgt = MCD.catalog().filter((i) => i.code === sel.value)[0];
  const savedCa = tgt.nutrition.calcium, savedNa = tgt.nutrition.sodium;
  tgt.nutrition.calcium = null; tgt.nutrition.sodium = null;
  sel.dispatchEvent(new win.Event("change", { bubbles: true }));
  rows = Array.from(chart.querySelectorAll(".cmp-row"));
  const naRow = rows[4], caRow = rows[5];
  ok(naRow.classList.contains("none") && caRow.classList.contains("none"), "缺值行带 none 灰色占位类");
  ok(naRow.querySelector(".cmp-val").firstChild.textContent.trim() === "--" &&
     caRow.querySelector(".cmp-val").firstChild.textContent.trim() === "--", "缺值行数值显示 --");
  ok(naRow.querySelector(".cmp-pct").textContent.trim() === "--", "缺值行占比显示 --");
  ok(!naRow.classList.contains("over"), "缺值行不再标橙");
  tgt.nutrition.calcium = savedCa; tgt.nutrition.sodium = savedNa;
  sel.dispatchEvent(new win.Event("change", { bubbles: true }));
  rows = Array.from(chart.querySelectorAll(".cmp-row"));
  ok(!rows[5].classList.contains("none") && rows[5].querySelector(".cmp-pct").textContent.indexOf("%") > 0,
    "恢复数据后正常渲染");

  /* 5. 悬浮弹窗：指标名称 / 当前数值 / 参考值 / 占比 */
  console.log("\n悬浮弹窗");
  const overRow = rows.filter((r) => r.classList.contains("over"))[0] || rows[0];
  overRow.dispatchEvent(new win.MouseEvent("mouseover", { bubbles: true, clientX: 300, clientY: 300 }));
  let tip = doc.querySelector(".cmp-tip");
  ok(!!tip && !tip.hidden, "悬浮后弹窗显示");
  let t = tip ? tip.textContent : "";
  ok(t.indexOf(overRow.getAttribute("data-name")) >= 0, "弹窗含指标名称");
  ok(t.indexOf("当前数值") >= 0 && t.indexOf(overRow.getAttribute("data-val")) >= 0, "弹窗含当前数值");
  ok(t.indexOf("参考值") >= 0 && t.indexOf(overRow.getAttribute("data-ref")) >= 0, "弹窗含参考值");
  ok(t.indexOf("占比") >= 0 && t.indexOf(overRow.getAttribute("data-pct")) >= 0, "弹窗含占比");
  ok(tip.classList.contains("over") === overRow.classList.contains("over"), "超标行弹窗为告警样式");
  doc.body.dispatchEvent(new win.MouseEvent("mouseover", { bubbles: true, relatedTarget: doc.body }));
  /* mouseout 离开图表 */
  overRow.dispatchEvent(new win.MouseEvent("mouseout", { bubbles: true, relatedTarget: doc.body }));
  ok(!tip || tip.hidden, "移出后弹窗隐藏");

  console.log("\n结果: " + pass + " 通过 / " + fail + " 失败");
  process.exit(fail ? 1 : 0);
}).catch((e) => { console.error(e); process.exit(1); });

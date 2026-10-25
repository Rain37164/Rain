/* 雷达图组件回归测试
   用法: node tools/radartest.js [baseUrl]
   覆盖：百分比口径、刻度 0/25/50/75/100%、>100% 顶点外扩与标红、
        标签三行内容与不越界、图例、悬浮弹窗四要素 */
const { JSDOM } = require("jsdom");

const base = process.argv[2] || "http://127.0.0.1:8765";
let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log("  [OK] " + msg); }
  else { fail++; console.log("  [FAIL] " + msg); }
}

const DAILY = { 热量: 2000, 蛋白: 60, 脂肪: 60, 碳水: 250, 钠: 2000 };

JSDOM.fromURL(base + "/index.html", {
  runScripts: "dangerously", resources: "usable", pretendToBeVisual: true
}).then((dom) => new Promise((r) => setTimeout(() => r(dom), 1200))).then((dom) => {
  const win = dom.window, doc = win.document;
  const MCD = win.MCD;
  if (!MCD) { console.log("[FAIL] MCD 未加载"); process.exit(1); }

  /* ---- 场景 A：全部低于 100% ---- */
  const rowsA = [
    { label: "热量", value: 707, unit: "kcal", cap: DAILY["热量"] },
    { label: "蛋白", value: 30.5, unit: "g", cap: DAILY["蛋白"] },
    { label: "脂肪", value: 28.2, unit: "g", cap: DAILY["脂肪"] },
    { label: "碳水", value: 86.4, unit: "g", cap: DAILY["碳水"] },
    { label: "钠", value: 1240, unit: "mg", cap: DAILY["钠"] }
  ];
  /* ---- 场景 B：含超标（钠 3200mg = 160%）与极端超标（钠 8000mg = 400%，触发截断箭头） ---- */
  const rowsB = rowsA.map((r) => Object.assign({}, r));
  rowsB[4] = { label: "钠", value: 3200, unit: "mg", cap: 2000 };
  const rowsC = rowsA.map((r) => Object.assign({}, r));
  rowsC[4] = { label: "钠", value: 8000, unit: "mg", cap: 2000 };

  function parse(html) {
    const box = doc.createElement("div");
    box.innerHTML = html;
    const svg = box.querySelector("svg");
    const polys = Array.from(svg.querySelectorAll("polygon"));
    const circles = Array.from(svg.querySelectorAll("circle")).filter((c) => c.getAttribute("class") !== "rhit"
      && !c.closest(".rvert"));
    const texts = Array.from(svg.querySelectorAll("text"));
    const verts = Array.from(svg.querySelectorAll(".rvert"));
    const vb = svg.getAttribute("viewBox").split(/\s+/).map(Number);
    const size = vb[2];
    const center = [size / 2, size / 2];
    function distOfPoly(poly, i) {
      const pts = poly.getAttribute("points").trim().split(/\s+/).map((s) => s.split(",").map(Number));
      return Math.hypot(pts[i][0] - center[0], pts[i][1] - center[1]);
    }
    return { box, svg, polys, circles, texts, verts, size, center, distOfPoly };
  }
  function textOf(el) { return (el.textContent || "").trim(); }

  [["场景A 全部未超标", rowsA], ["场景B 钠 160% 超标", rowsB], ["场景C 钠 400% 截断", rowsC]]
    .forEach(([name, rows]) => {
      console.log("\n" + name);
      const p = parse(MCD.radarSVG(rows, 280));
      const size = p.size;

      /* 1. 网格环保留、圆心区域不再有任何刻度文字 */
      const tickTexts = p.texts.filter((t) => parseFloat(t.getAttribute("font-size")) < 10);
      ok(tickTexts.length === 0, "圆心区域无刻度文字（" + tickTexts.length + " 个）");
      ok(p.texts.every((t) => Math.abs(parseFloat(t.getAttribute("x")) - p.center[0]) > 4 ||
                               Math.abs(parseFloat(t.getAttribute("y")) - p.center[1]) > 4),
        "所有文字均在雷达图外侧，未压在圆心区域");

      /* 2. 顶点数量与字段 */
      ok(p.verts.length === rows.length, "顶点数 " + p.verts.length + " = 维度数 " + rows.length);
      p.verts.forEach((g, i) => {
        ok(textOf(g.querySelector("title")).indexOf("每日推荐") > 0, rows[i].label + " title 含每日推荐值");
        ok(g.getAttribute("data-cap") !== null, rows[i].label + " 带 data-cap（每日推荐值）");
        ok(g.getAttribute("data-value") !== null && g.getAttribute("data-pct") !== null,
          rows[i].label + " 带当前值与占比");
      });

      /* 3. 百分比口径：占比 = 当前值 ÷ 每日推荐 × 100% */
      rows.forEach((r, i) => {
        const want = Math.round(r.value / r.cap * 1000) / 10;
        const got = p.verts[i].getAttribute("data-pct");
        const okPct = Math.abs(parseFloat(got) - want) <= (r.value / r.cap > 1 ? 0.6 : 0.06);
        ok(okPct, rows[i].label + " 占比 " + got + "（应为 " + want + "%）");
      });

      /* 4. 几何：>100% 顶点必须外扩到 100% 边界之外；未超标顶点不得越过 100% 边界
            polygon 顺序：0 = 100% 红色虚线五边形预警边界，1 = 数据多边形（+ 可选截断箭头）
            circle 顺序：0 = 最外完整圆形轮廓，1..4 = 向内同心细圆环 */
      const ring100 = p.polys[0], data = p.polys[1];
      ok(!!ring100 && !!data, "100% 预警五边形 / 数据多边形齐备");
      const clippedEarly = rows.some((r) => r.value / r.cap > 1.18);
      ok(p.polys.length === 2 + (clippedEarly ? 1 : 0),
        "预警五边形 + 数据多边形" + (clippedEarly ? " + 截断箭头" : "") + "（共 " + p.polys.length + " 个多边形）");
      /* 网格已改为圆形，不应再有五边形刻度环 */
      ok(p.polys.filter((el) => el.getAttribute("fill") === "none").length === 1,
        "网格五边形刻度环已移除，仅保留 1 个红色预警五边形");
      ok((ring100.getAttribute("stroke") || "").indexOf("255,90,95") >= 0 &&
         !!ring100.getAttribute("stroke-dasharray"), "100% 参考边界为红色虚线");
      /* 同心圆背景网格 */
      ok(p.circles.length === 5, "同心圆网格 5 圈（" + p.circles.length + "）");
      ok((p.circles[0].getAttribute("stroke") || "").indexOf("127,216,255") >= 0 &&
         !p.circles[0].getAttribute("stroke-dasharray"), "最外层为完整圆形轮廓（实线）");
      ok(p.circles.slice(1).every((c) => !!c.getAttribute("stroke-dasharray")),
        "向内各层为细圆环网格（虚线）");
      const rs = p.circles.map((c) => parseFloat(c.getAttribute("r")));
      ok(rs.every((r, k) => k === 0 || r < rs[k - 1] - 1), "圆半径由外向内递减 [" + rs.map((r) => r.toFixed(0)).join(" > ") + "]");
      /* 五边形顶点恰好落在 100% 处，且整体位于最外圆内部 */
      const R100 = p.distOfPoly(ring100, 0);
      ok(R100 < rs[0] - 1, "预警五边形半径 " + R100.toFixed(1) + " < 最外圆 " + rs[0].toFixed(1) + "（叠加在圆网格内部）");

      /* 5. 外扩上限：超标顶点不得越过 118% 上限（不越过最外圆） */
      rows.forEach((r, i) => {
        const dv = p.distOfPoly(data, i);
        if (r.value / r.cap > 1.000001) {
          ok(dv > R100 + 0.5, rows[i].label + " 超标顶点外扩到 100% 边界之外 (" + dv.toFixed(1) + " > " + R100.toFixed(1) + ")");
          ok(dv <= R100 * 1.18 + 0.5, rows[i].label + " 外扩不超过 118% 上限 (" + dv.toFixed(1) + ")");
        } else {
          ok(dv <= R100 + 0.5, rows[i].label + " 未超标顶点落在 100% 边界内 (" + dv.toFixed(1) + " <= " + R100.toFixed(1) + ")");
        }
      });

      /* 5. 超标标红：顶点 data-over=1 + 红连线 + 红色顶点圆 */
      rows.forEach((r, i) => {
        const over = r.value / r.cap > 1.000001;
        const g = p.verts[i];
        ok((g.getAttribute("data-over") === "1") === over,
          rows[i].label + " data-over 标记 = " + over);
        ok(g.classList.contains("over") === over, rows[i].label + " 顶点 over 样式类 = " + over);
      });
      const redLines = Array.from(p.svg.querySelectorAll("line"))
        .filter((l) => (l.getAttribute("stroke") || "") === "#ff5a5f" &&
                       l.getAttribute("stroke-width") === "2.4");   /* 仅超标连线，排除截断箭头 */
      const overCount = rows.filter((r) => r.value / r.cap > 1.000001).length;
      ok(redLines.length === overCount * 2, "红色连线数 " + redLines.length + " = 超标维度数 " + overCount + " × 2");

      /* 6. 截断箭头（极端超标时提示「实际更高」） */
      const clipped = rows.some((r) => r.value / r.cap > 1.18);
      const redTri = Array.from(p.svg.querySelectorAll("polygon"))
        .filter((el) => (el.getAttribute("fill") || "") === "#ff5a5f");
      ok(clipped ? redTri.length === 1 : redTri.length === 0,
        clipped ? "极端超标：绘制向外截断箭头" : "未极端超标：无截断箭头");

      /* 7. 标签：三行（名称 / 数值+单位 / 百分比），且不越出画布 */
      const axisTexts = p.texts.filter((t) => parseFloat(t.getAttribute("font-size")) >= 10);
      ok(axisTexts.length === rows.length * 3, "轴标签 " + axisTexts.length + " 个 = " + rows.length + " 维 × 3 行");
      let minGap = Infinity, maxRight = 0, minLeft = size;
      axisTexts.forEach((t) => {
        const x = parseFloat(t.getAttribute("x")), y = parseFloat(t.getAttribute("y"));
        const fs = parseFloat(t.getAttribute("font-size"));
        const s = textOf(t);
        let w = 0;
        for (const ch of s) w += /[\u2E80-\u9FFF\uFF00-\uFF60]/.test(ch) ? fs : fs * 0.56;
        minLeft = Math.min(minLeft, x - w / 2);
        maxRight = Math.max(maxRight, x + w / 2);
        ok(y >= 0 && y <= size, "标签纵向在画布内 y=" + y.toFixed(1));
        minGap = Math.min(minGap, Math.hypot(x - p.center[0], y - p.center[1]));
      });
      ok(minLeft >= -0.5 && maxRight <= size + 0.5,
        "标签横向不越界 [" + minLeft.toFixed(1) + ", " + maxRight.toFixed(1) + "] ⊂ [0, " + size + "]");
      /* 标签环必须在最外顶点之外（保证不压图形） */
      const maxVert = rows.reduce((m, r, i) => Math.max(m, p.distOfPoly(data, i)), 0);
      const labR = maxVert === 0 ? 0 : minGap;
      ok(labR > maxVert + 8, "标签环半径 " + labR.toFixed(1) + " > 最外顶点 " + maxVert.toFixed(1) + " + 8");

      /* 8. 标题 + 图例（默认：标题「营养结构 · 占每日推荐 %」+ 蓝色单项图例） */
      const title = p.box.querySelector(".radar-title");
      ok(!!title && title.textContent.indexOf("营养结构") >= 0 && title.textContent.indexOf("占每日推荐 %") >= 0,
        "图表标题：营养结构 · 占每日推荐 %");
      const legend = p.box.querySelector(".radar-legend");
      ok(!!legend, "含图例容器");
      const legendItems = legend ? legend.querySelectorAll(".rl-item") : [];
      ok(legendItems.length === 1, "图例 1 项（" + legendItems.length + "）");
      ok(!!legend && legend.textContent.indexOf("蓝色区域：当前套餐营养占比") >= 0, "图例文字：蓝色区域：当前套餐营养占比");
      ok(!!p.box.querySelector(".rl-blue"), "图例含蓝色方框");
      ok(legend.textContent.indexOf("红色") < 0, "图例不再含红色顶点说明项");
    });

  /* ---- 变体：opt.title / opt.legend ---- */
  console.log("\n组件变体");
  const v1 = parse(MCD.radarSVG(rowsA, 280, { title: false }));
  ok(!v1.box.querySelector(".radar-title"), "opt.title=false：不渲染标题（由外层卡片标题承担）");
  const v2 = parse(MCD.radarSVG(rowsA, 280, { legend: "full" }));
  const li2 = v2.box.querySelectorAll(".radar-legend .rl-item");
  ok(li2.length === 2, "opt.legend=full：图例 2 项（" + li2.length + "）");
  ok(!!v2.box.querySelector(".rl-red"), "opt.legend=full：含红色虚线图例项");
  ok((v2.box.textContent || "").indexOf("100% 参考边界") >= 0, "红色图例文字说明 100% 参考边界");
  const v3 = parse(MCD.radarSVG(rowsA, 280, { legend: false }));
  ok(!v3.box.querySelector(".radar-legend"), "opt.legend=false：不渲染图例");

  /* ---- 交互：悬浮顶点弹窗四要素 ---- */
  console.log("\n悬浮弹窗");
  const host = doc.createElement("div");
  host.innerHTML = MCD.radarSVG(rowsB, 280);
  doc.body.appendChild(host);
  const g = host.querySelector(".rvert");
  const hit = g.querySelector(".rhit");
  const ev = new win.MouseEvent("mouseover", { bubbles: true, clientX: 200, clientY: 200 });
  hit.dispatchEvent(ev);
  const tip = doc.querySelector(".radar-tip");
  ok(!!tip && !tip.hidden, "悬浮后弹窗显示");
  const t = tip ? tip.textContent : "";
  ok(t.indexOf("热量") >= 0, "弹窗含营养名称");
  ok(t.indexOf("当前值") >= 0 && t.indexOf("707") >= 0, "弹窗含当前值 707");
  ok(t.indexOf("每日推荐") >= 0 && t.indexOf("2000") >= 0, "弹窗含每日推荐值 2000");
  ok(t.indexOf("占比") >= 0 && t.indexOf("%") >= 0, "弹窗含占比百分比");
  ok(!!tip.querySelector(".rt-rows .rt-row"), "弹窗使用分行明细布局");

  /* 超标顶点弹窗应为告警样式 */
  const overG = Array.from(host.querySelectorAll(".rvert")).find((x) => x.getAttribute("data-over") === "1");
  overG.querySelector(".rhit").dispatchEvent(new win.MouseEvent("mouseover", { bubbles: true, clientX: 210, clientY: 210 }));
  ok(tip.classList.contains("warn"), "超标顶点弹窗为告警样式（红色）");

  console.log("\n结果: " + pass + " 通过 / " + fail + " 失败");
  process.exit(fail ? 1 : 0);
}).catch((e) => { console.error(e); process.exit(1); });

/* 真实浏览器交互检查（playwright-core + 系统 Chrome）：
   1) 展开下拉：自动定位失败不得弹 modal；面板高度≈2 个条目；height 与 max-height 双写
   2) 真实滚轮落在列表与搜索框上都能滚动列表（搜索框上滚动列表且不翻页）
   3) 页面滚到底部（页脚贴近按钮）时面板不压页脚
   4) 截图存 tools/shots/store_*.png
   用法：NODE_PATH=<managed workspace>/node_modules node tools/browser-check.js [baseUrl]
   退出码：0 全过，1 有失败 */
const { chromium } = require("playwright-core");
const path = require("path");

const BASE = process.argv[2] || "http://127.0.0.1:8765";
const OUT = path.join(__dirname, "shots");
let pass = 0, fail = 0;
function ok(cond, msg) {
  console.log((cond ? "  [OK] " : "  [FAIL] ") + msg);
  cond ? pass++ : fail++;
}

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(BASE + "/index.html", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  await page.click("#storeBtn");
  await page.waitForTimeout(1500);   // 等自动定位失败流程走完

  const open = await page.evaluate(() => {
    var p = document.getElementById("storePanel");
    var l = document.getElementById("storeList");
    return {
      hidden: p.hidden,
      modalOpen: !document.getElementById("geoModal").hidden,
      maxH: p.style.maxHeight, height: p.style.height,
      up: p.classList.contains("up"),
      panelH: Math.round(p.getBoundingClientRect().height),
      itemCount: document.querySelectorAll(".store-opt").length,
      listSH: l.scrollHeight, listCH: l.clientHeight
    };
  });
  ok(!open.hidden, "面板展开");
  ok(!open.modalOpen, "自动定位失败不弹 modal（不再遮挡下拉）");
  ok(open.maxH && open.height, "height 与 max-height 双写 -> " + open.height + " / " + open.maxH);
  ok(open.panelH <= 206, "面板高度 ≈2 个条目（<=206px，实际 " + open.panelH + "）");
  ok(open.listSH > open.listCH, "列表可滚动（sh " + open.listSH + " > ch " + open.listCH + "）");

  /* 真实滚轮：列表上 */
  let lbox = await page.locator("#storeList").boundingBox();
  await page.mouse.move(lbox.x + lbox.width / 2, lbox.y + Math.min(40, lbox.height / 2));
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(200);
  const st1 = await page.evaluate(() => Math.round(document.getElementById("storeList").scrollTop));
  ok(st1 > 0, "滚轮在列表上 → 列表滚动（scrollTop " + st1 + "）");

  /* 真实滚轮：搜索框上（非滚动区）→ 也应滚动列表 */
  let sbox = await page.locator("#storeSearch").boundingBox();
  await page.mouse.move(sbox.x + 30, sbox.y + 8);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(200);
  const st2 = await page.evaluate(() => Math.round(document.getElementById("storeList").scrollTop));
  ok(st2 >= st1, "滚轮在搜索框上 → 列表继续滚动（scrollTop " + st2 + "）");

  /* 列表滚到底后再滚 → 应交还页面滚动（不把页面卡死） */
  await page.evaluate(() => { window.scrollTo(0, 0); });
  const y0 = await page.evaluate(() => Math.round(window.scrollY));
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(200);
  const y1 = await page.evaluate(() => Math.round(window.scrollY));
  ok(y1 > y0, "列表到底后继续滚 → 页面滚动（scrollY " + y0 + " → " + y1 + "）");

  await page.evaluate(() => { window.scrollTo(0, 0); document.getElementById("storeList").scrollTop = 0; });
  await page.screenshot({ path: path.join(OUT, "store_open.png") });

  /* 页面滚动时：高度与方向必须保持锁定（不收缩、不翻转） */
  const before = await page.evaluate(() => {
    var p = document.getElementById("storePanel");
    return { h: p.style.height, up: p.classList.contains("up"), y: Math.round(window.scrollY) };
  });
  ok(before.y === 0, "展开下拉不把页面滚走（scrollY " + before.y + "）");
  const samples = [];
  for (const y of [300, 600, 900]) {
    await page.evaluate(yy => window.scrollTo(0, yy), y);
    await page.waitForTimeout(200);
    samples.push(await page.evaluate(() => {
      var p = document.getElementById("storePanel");
      return { h: p.style.height, up: p.classList.contains("up") };
    }));
  }
  const stable = samples.every(s => s.h === before.h && s.up === before.up);
  ok(stable, "页面滚动时高度与方向锁定（" + before.h + "/" + (before.up ? "上" : "下") + " → " +
    samples.map(s => s.h + "/" + (s.up ? "上" : "下")).join(", ") + "）");
  ok(!before.up, "默认朝下展开");

  /* 滚到底部：页脚顶贴近按钮下方时，面板不应压住页脚 */
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  const foot = await page.evaluate(() => {
    var p = document.getElementById("storePanel");
    var f = document.getElementById("foot");
    var pr = p.getBoundingClientRect(), fr = f.getBoundingClientRect();
    return {
      up: p.classList.contains("up"), maxH: p.style.maxHeight,
      panelBottom: Math.round(pr.bottom), panelTop: Math.round(pr.top),
      footerTop: Math.round(fr.top),
      overlap: pr.bottom > fr.top + 1 && pr.top < fr.bottom - 1
    };
  });
  ok(!foot.overlap, "页面滚到底部：面板不压页脚（panel 底 " + foot.panelBottom + " vs footer 顶 " + foot.footerTop +
     (foot.up ? "，已向上展开" : "") + "）");
  await page.screenshot({ path: path.join(OUT, "store_footer.png"), fullPage: false });

  console.log("\n结果: " + pass + " 通过 / " + fail + " 失败");
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });

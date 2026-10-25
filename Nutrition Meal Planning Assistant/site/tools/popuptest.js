/* 门店下拉弹窗交互测试（jsdom）
   验证：默认收起 / 展开 / 搜索过滤 / 清空 / 选中回显 / 字段完整 / 方向类与高度写入
   用法：node tools/popuptest.js http://127.0.0.1:8765/index.html
   注意：jsdom 无布局引擎，getBoundingClientRect / scrollHeight 恒为 0，
        方向判断只能验证「代码路径不报错 + 兜底高度生效」，真实方向需在浏览器确认。 */
const { JSDOM } = require("jsdom");

const url = process.argv[2] || "http://127.0.0.1:8765/index.html";
let pass = 0, fail = 0;
function ok(cond, label, extra) {
  if (cond) { pass++; console.log("  [OK] " + label); }
  else { fail++; console.log("  [FAIL] " + label + (extra ? " -> " + extra : "")); }
}

JSDOM.fromURL(url, {
  runScripts: "dangerously", resources: "usable", pretendToBeVisual: true
}).then(dom => new Promise(res => setTimeout(() => res(dom), 2500))).then(dom => {
  const win = dom.window, doc = win.document;
  const panel = doc.getElementById("storePanel");
  const list = doc.getElementById("storeList");
  const btn = doc.getElementById("storeBtn");
  const search = doc.getElementById("storeSearch");
  const clear = doc.getElementById("storeSearchClear");
  const count = doc.getElementById("storeCount");
  const value = doc.getElementById("storeValue");

  console.log("\n=== 门店弹窗测试 ===");
  ok(!!panel && panel.hidden, "初始：面板收起");
  ok(!!search, "初始：搜索框存在");
  ok(list.querySelectorAll(".store-opt").length > 0, "初始：列表已渲染 " +
    list.querySelectorAll(".store-opt").length + " 项");

  const click = el => el.dispatchEvent(new win.MouseEvent("click", { bubbles: true, cancelable: true }));
  const type = (el, v) => {
    el.value = v;
    el.dispatchEvent(new win.Event("input", { bubbles: true }));
  };

  click(btn);
  ok(!panel.hidden, "点击门店框：面板展开");
  ok(btn.getAttribute("aria-expanded") === "true", "点击门店框：aria-expanded=true");
  const total = list.querySelectorAll(".store-opt").length;

  // 字段完整性：名称 / 地址 / 距离 / 营业状态
  const first = list.querySelector(".store-opt");
  const fields = {
    name: first.querySelector(".st-name") && first.querySelector(".st-name").textContent.trim(),
    addr: first.querySelector(".st-addr") && first.querySelector(".st-addr").textContent.trim(),
    dist: first.querySelector(".st-dist") && first.querySelector(".st-dist").textContent.trim(),
    tag: first.querySelector(".st-tag") && first.querySelector(".st-tag").textContent.trim()
  };
  ok(!!fields.name, "字段：门店名称 -> " + fields.name);
  ok(!!fields.addr, "字段：地址 -> " + fields.addr);
  ok(!!fields.dist, "字段：距离 -> " + fields.dist);
  ok(!!fields.tag, "字段：营业状态 -> " + fields.tag);
  ok(count.textContent.indexOf(String(total)) >= 0, "计数条：显示总数 -> " + count.textContent);

  // 搜索：命中单个
  type(search, "新百");
  const n1 = list.querySelectorAll(".store-opt").length;
  ok(n1 === 1, "搜索「新百」：命中 1 家（实际 " + n1 + "）");
  ok(count.textContent.indexOf("匹配") >= 0, "搜索后计数：显示匹配数 -> " + count.textContent);
  ok(!clear.hidden, "搜索后：清除按钮出现");

  // 搜索：地址关键词
  type(search, "汉中路");
  const n2 = list.querySelectorAll(".store-opt").length;
  ok(n2 >= 1, "搜索地址「汉中路」：命中 " + n2 + " 家");
  ok(list.querySelector(".st-name").textContent.indexOf("汉中路") >= 0 ||
     list.querySelector(".st-addr").textContent.indexOf("汉中路") >= 0,
     "搜索地址：结果确实包含该关键词");

  // 搜索：无结果
  type(search, "zzzz不存在");
  ok(list.querySelectorAll(".store-opt").length === 0, "搜索无结果：无门店项");
  ok(!!list.querySelector(".sl-empty"), "搜索无结果：显示空态提示");

  // 清空
  click(clear);
  ok(list.querySelectorAll(".store-opt").length === total, "清空搜索：恢复全部 " + total + " 家");
  ok(clear.hidden, "清空后：清除按钮隐藏");

  // 选中
  const target = list.querySelectorAll(".store-opt")[1];
  const targetName = target.querySelector(".st-name").textContent.trim();
  click(target);
  ok(panel.hidden, "选中门店：面板收起");
  ok(value.textContent.trim() === targetName, "选中门店：回显名称 -> " + value.textContent.trim());
  ok(doc.getElementById("store").value !== "", "选中门店：storeCode 已写入 -> " + doc.getElementById("store").value);

  // 重新展开：搜索词已复位
  click(btn);
  ok(search.value === "", "再次展开：搜索词已复位");
  ok(list.querySelectorAll(".store-opt").length === total, "再次展开：全量列表");
  ok(!doc.getElementById("gen").disabled, "选中后：生成按钮可用");

  // 高度兜底（jsdom 无布局，scrollHeight=0 时应回落到默认 206 / 190）
  const mh = panel.style.maxHeight;
  ok(!!mh && parseFloat(mh) > 0, "高度：已写入 max-height -> " + mh);
  ok(!!panel.style.height && parseFloat(panel.style.height) > 0,
     "高度：同时写入显式 height（保证合成器标记列表可滚动） -> " + panel.style.height);

  /* ---- 展开方向：jsdom 无布局，用桩数据模拟三种视口场景 ---- */
  console.log("\n--- 展开方向（桩数据）---");
  const row = doc.getElementById("storeRow");
  const stubRect = (top, bottom) => Object.defineProperty(row, "getBoundingClientRect", {
    configurable: true,
    value: () => ({ top, bottom, left: 0, right: 300, width: 300, height: bottom - top })
  });
  const stubContent = h => Object.defineProperty(panel, "scrollHeight", {
    configurable: true, get: () => h
  });
  const stubVH = h => Object.defineProperty(win, "innerHeight", { configurable: true, value: h });
  /* 方向只在「展开瞬间」决定（默认朝下，滚动不再翻转），
     因此这里用「关闭再展开」触发定位，而不是派发 resize */
  const reopen = () => {
    if (!panel.hidden) click(btn);
    click(btn);
  };
  const up = () => panel.classList.contains("up");
  const h = () => Math.round(parseFloat(panel.style.maxHeight));

  stubContent(350);                 // 内容自然高 350 > 默认 206
  stubVH(768);

  stubRect(166, 200); reopen();
  ok(!up() && h() === 206, "场景A 下方充足(548px)：向下展开，高度 206（实际 " + (up() ? "向上" : "向下") + " / " + h() + "px）");

  stubRect(666, 700); reopen();
  ok(up() && h() === 206, "场景B 下方仅48px、上方646px：向上展开，高度 206（实际 " + (up() ? "向上" : "向下") + " / " + h() + "px）");

  stubVH(300); stubRect(140, 174); reopen();
  ok(up() && h() === 120, "场景C 矮视口(300px) 上120/下106：向上展开并收敛到 120px（实际 " + (up() ? "向上" : "向下") + " / " + h() + "px）");

  stubVH(768); stubRect(600, 634); stubContent(90); reopen();
  ok(!up() && h() === 90, "场景D 内容仅90px(1家门店)：向下展开且高度贴合内容 90px（实际 " + (up() ? "向上" : "向下") + " / " + h() + "px）");

  console.log("\n结果: " + pass + " 通过 / " + fail + " 失败");
  dom.window.close();
  process.exit(fail ? 1 : 0);
}).catch(e => { console.error("运行失败:", e.message); process.exit(2); });

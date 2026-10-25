/* ==========================================================================
   麦当劳营养配餐助手 · 核心逻辑
   数据全部来自官方 MCP 快照（data-embed.js），本文件不含任何硬编码营养值
   ========================================================================== */
(function () {
  "use strict";

  var D = window.MCD_DATA || {};
  var NUT = D.nutrition || [];
  var MEALS = (D.menu && D.menu.data && D.menu.data.meals) || {};
  var CATS = (D.menu && D.menu.data && D.menu.data.categories) || [];
  var STORES = D.stores || [];

  var NUM_KEYS = ["energyKj", "energyKcal", "protein", "fat", "carbohydrate", "sodium", "calcium"];

  /* ---------- 文本归一化 ---------- */
  function norm(s) {
    return String(s || "")
      .replace(/[\s\u3000]/g, "")
      .replace(/[（）]/g, function (m) { return m === "（" ? "(" : ")"; })
      .replace(/[·・]/g, "")
      .replace(/™/g, "")
      .toLowerCase();
  }

  /* ------------------------------------------------------------------
     名称对齐策略（官方营养表与门店菜单命名口径不一致）
     1) 完全同名 → 直接采用（精确）
     2) 组合餐（套餐/三件套/四件套/随心配…）→ 一律不匹配
        因为营养表只收录单品，用单品营养代表套餐会严重低估热量
     3) 仅规格差异（中杯/大杯/冰/热…）→ 采用并标注实际规格
     4) 少量无语义歧义的别名 → 采用并标注
     任何命中近似匹配的餐品，界面都会显示「营养来源：xxx」
     ------------------------------------------------------------------ */
  var ALIAS = {
    "薯条": "中薯条",
    "麦乐鸡": "麦乐鸡5块",
    "麦辣鸡翅": "麦辣鸡翅-2块"
  };

  var SPEC_WORDS = ["中杯", "大杯", "小杯", "盒装", "瓶装", "冰", "热"];
  var COMBO_WORDS = ["套餐", "三件套", "四件套", "随心选", "随心配", "分享餐", "任选", "拼盘", "双人", "多人", "双堡", "组合"];

  function isCombo(name) {
    for (var i = 0; i < COMBO_WORDS.length; i++) if (name.indexOf(COMBO_WORDS[i]) >= 0) return true;
    return false;
  }

  /* 剥离规格前后缀：中杯怡泉+C / 可乐中杯 → 本体 */
  function stripSpec(s) {
    var changed = true;
    while (changed) {
      changed = false;
      for (var i = 0; i < SPEC_WORDS.length; i++) {
        var w = SPEC_WORDS[i];
        if (s.length > w.length && s.indexOf(w) === 0) { s = s.slice(w.length); changed = true; break; }
        if (s.length > w.length && s.slice(-w.length) === w) { s = s.slice(0, -w.length); changed = true; break; }
      }
    }
    return s;
  }

  /* ---------- 建营养索引 ---------- */
  var nutByExact = {}, nutNorm = {}, nutStripped = {};
  NUT.forEach(function (r) {
    if (!r.productName) return;
    nutByExact[r.productName] = r;
    nutNorm[norm(r.productName)] = r;
    var s = stripSpec(norm(r.productName));
    if (!nutStripped[s]) nutStripped[s] = r;
  });

  /* 匹配菜单餐品 → 营养数据；返回 {row, via, approx} 或 null */
  function matchNutrition(name) {
    if (!name) return null;
    if (nutByExact[name]) return { row: nutByExact[name], via: name };
    var n = norm(name);
    if (nutNorm[n]) return { row: nutNorm[n], via: nutNorm[n].productName };
    if (isCombo(name)) return null;                       // 组合餐不做近似
    if (ALIAS[name] && nutByExact[ALIAS[name]]) {
      return { row: nutByExact[ALIAS[name]], via: ALIAS[name], approx: true };
    }
    var st = stripSpec(n);
    if (nutStripped[st]) {
      return { row: nutStripped[st], via: nutStripped[st].productName, approx: true };
    }
    return null;
  }

  /* ---------- 可点餐品目录（菜单 ∩ 营养表） ---------- */
  var CATALOG = null;
  function catalog() {
    if (CATALOG) return CATALOG;
    CATALOG = [];
    Object.keys(MEALS).forEach(function (code) {
      var m = MEALS[code];
      var hit = matchNutrition(m.name);
      if (!hit) return;
      CATALOG.push({
        code: code,
        name: m.name,
        price: parseFloat(m.currentPrice) || 0,
        originalPrice: parseFloat(m.originalPrice) || parseFloat(m.currentPrice) || 0,
        image: m.image || "",
        discountType: m.discountType || null,
        nutrition: hit.row,
        nutritionVia: hit.via,
        approx: !!hit.approx
      });
    });
    return CATALOG;
  }

  /* ---------- 分类判定（用于配餐结构） ---------- */
  var DRINK_KW = ["可乐", "雪碧", "芬达", "红茶", "咖啡", "奶", "汁", "纯悦", "冰淇淋", "新地", "麦旋风", "奶昔", "美式", "拿铁", "卡布", "怡泉", "阿芙佳朵", "奶铁"];
  var SIDE_KW = ["薯条", "鸡块", "鸡翅", "玉米", "派", "薯饼", "鸡排", "脆汁鸡", "芝士条", "扭扭薯", "V翅", "苹果片", "酱"];
  var MAIN_KW = ["堡", "汉堡", "卷", "套餐", "三件套", "四件套", "随心配", "分享餐", "任选"];

  function roleOf(name) {
    for (var i = 0; i < MAIN_KW.length; i++) if (name.indexOf(MAIN_KW[i]) >= 0) return "main";
    for (var j = 0; j < SIDE_KW.length; j++) if (name.indexOf(SIDE_KW[j]) >= 0) return "side";
    for (var k = 0; k < DRINK_KW.length; k++) if (name.indexOf(DRINK_KW[k]) >= 0) return "drink";
    if (name.indexOf("随心配") >= 0) return "main";
    return "side";
  }

  /* ---------- 忌口过滤 ---------- */
  var AVOID = {
    beef:  ["牛", "安格斯", "吉士", "巨无霸", "厚牛"],
    chicken: ["鸡", "板烧", "麦辣鸡", "脆汁"],
    fish:  ["鱼", "鳕"],
    pork:  ["猪", "培根", "烟肉", "火腿"],
    fried: ["薯条", "鸡块", "鸡翅", "脆汁", "鸡排", "扭扭薯", "芝士条", "V翅", "炸"],
    sweet: ["冰淇淋", "新地", "麦旋风", "派", "奶昔", "黑巧"],
    drink: ["可乐", "雪碧", "红茶", "咖啡", "奶", "汁", "纯悦", "怡泉", "美式", "拿铁", "卡布", "水"]
  };

  function hitAvoid(name, keys) {
    for (var i = 0; i < keys.length; i++) {
      var kw = AVOID[keys[i]] || [];
      for (var j = 0; j < kw.length; j++) if (name.indexOf(kw[j]) >= 0) return true;
    }
    return false;
  }

  /* ---------- 配餐求解 ---------- */
  /* opts: { kcal, goal: 'balance'|'cut'|'bulk', avoid: [], count }
     评分：热量偏差为主，营养目标为约束惩罚，平价优先（同分时） */
  function generatePlans(opts) {
    opts = opts || {};
    var target = opts.kcal || 700;
    var goal = opts.goal || "balance";
    var avoid = opts.avoid || [];

    var pool = catalog().filter(function (it) {
      if (it.nutrition.energyKcal == null) return false;
      if (avoid.length && hitAvoid(it.name, avoid)) return false;
      return true;
    });
    if (!pool.length) return [];

    var mains = pool.filter(function (i) { return roleOf(i.name) === "main"; });
    var sides = pool.filter(function (i) { return roleOf(i.name) === "side"; });
    var drinks = pool.filter(function (i) { return roleOf(i.name) === "drink"; });
    if (!mains.length) mains = pool.slice();

    var results = [];
    function score(items) {
      var kcal = 0, protein = 0, fat = 0, carb = 0, sodium = 0, price = 0;
      items.forEach(function (i) {
        var n = i.nutrition;
        kcal += n.energyKcal || 0; protein += n.protein || 0; fat += n.fat || 0;
        carb += n.carbohydrate || 0; sodium += n.sodium || 0; price += i.price;
      });
      var dev = Math.abs(kcal - target);
      if (dev > 100) return null; // 严格 ±100kcal

      var penalty = 0;
      if (goal === "cut") {
        // 减脂：控脂肪、控钠，鼓励蛋白
        penalty += Math.max(0, fat - kcal / 12) * 6;
        penalty += Math.max(0, sodium - 1800) / 40;
        penalty += Math.max(0, 22 - protein) * 4;
      } else if (goal === "bulk") {
        // 增肌：蛋白优先
        penalty += Math.max(0, 34 - protein) * 5;
        penalty += Math.max(0, 12 - fat) * 1.5;
      } else {
        penalty += Math.max(0, protein - 45) * 1.2;
        penalty += Math.max(0, sodium - 2400) / 60;
      }
      penalty += dev * 1.0;
      penalty += price * 0.35;              // 同等条件更省钱
      penalty += (items.length - 3) * 4;    // 结构更简洁

      return {
        items: items, kcal: kcal, protein: protein, fat: fat, carb: carb,
        sodium: sodium, price: price, dev: dev, score: penalty
      };
    }

    var i, j, k, l;
    for (i = 0; i < mains.length; i++) {
      var s1 = score([mains[i]]);
      if (s1) results.push(s1);
      for (j = 0; j < sides.length; j++) {
        var s2 = score([mains[i], sides[j]]);
        if (s2) results.push(s2);
        for (k = 0; k < drinks.length; k++) {
          if (sides[j].code === drinks[k].code) continue;
          var s3 = score([mains[i], sides[j], drinks[k]]);
          if (s3) results.push(s3);
        }
      }
      for (l = 0; l < drinks.length; l++) {
        var s4 = score([mains[i], drinks[l]]);
        if (s4) results.push(s4);
      }
    }

    results.sort(function (a, b) { return a.score - b.score; });

    // 去重：组合内商品集合相同或高度重叠则合并
    var picked = [];
    results.forEach(function (r) {
      if (picked.length >= (opts.count || 3)) return;
      var sig = r.items.map(function (x) { return x.code; }).sort().join("|");
      for (var p = 0; p < picked.length; p++) {
        if (picked[p].sig === sig) return;
        var share = r.items.filter(function (x) {
          return picked[p].items.some(function (y) { return y.code === x.code; });
        }).length;
        if (share === r.items.length && share === picked[p].items.length) return;
      }
      r.sig = sig;
      picked.push(r);
    });
    return picked;
  }

  /* ---------- 单人营养参考值（DRIs 参考值，仅作展示基准，不做医学建议） ---------- */
  var REF = { energyKcal: 840, protein: 22, fat: 25, carbohydrate: 120, sodium: 800, calcium: 260, energyKj: 3500 };

  /* ---------- 每日推荐摄入量上限（雷达图归一化基准） ---------- */
  /* 各营养素单位不同，禁止直接用原始数值画顶点：一律换算成「占每日推荐的百分比」 */
  var DAILY = { energyKcal: 2000, protein: 60, fat: 60, carbohydrate: 250, sodium: 2000 };
  var DAILY_UNIT = { energyKcal: "kcal", protein: "g", fat: "g", carbohydrate: "g", sodium: "mg" };

  /* ---------- 格式化 ---------- */
  function yuan(v) { return "¥" + (Math.round(v * 100) / 100).toFixed(2).replace(/\.00$/, ""); }
  function num(v, d) {
    if (v == null) return "—";
    var p = Math.pow(10, d == null || isNaN(d) ? 0 : d);
    return Math.round(v * p) / p;
  }
  function kcalOf(plan) { return Math.round(plan.kcal); }

  /* HTML 转义：任何来自接口或 URL 参数的值拼进 innerHTML 前都要过一遍 */
  var ESC_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return ESC_MAP[c]; }); }

  /* 统一指标块，hi 为高亮 */
  function metric(k, v, u, hi) {
    return '<div class="metric' + (hi ? " hi" : "") + '"><div class="k">' + esc(k) + '</div><div class="v">' + esc(v) +
      (u ? '<span class="u">' + esc(u) + "</span>" : "") + "</div></div>";
  }

  /* ---------- 通用 UI ---------- */
  var PAGES = [
    { href: "index.html", label: "配餐工作台", key: "index" },
    { href: "results.html", label: "配餐结果", key: "results" },
    { href: "detail.html", label: "单品详情", key: "detail" },
    { href: "dashboard.html", label: "营养仪表盘", key: "dashboard" },
    { href: "loading.html", label: "AI 生成", key: "loading" },
    { href: "guide.html", label: "接入说明", key: "guide" }
  ];

  function mountNav(active) {
    var el = document.getElementById("nav");
    if (!el) return;
    var links = PAGES.map(function (p) {
      return '<a href="' + p.href + '"' + (p.key === active ? ' class="on"' : '') + '>' + p.label + "</a>";
    }).join("");
    el.className = "nav";
    el.innerHTML =
      '<div class="nav-in">' +
        '<div class="brand"><span class="logo">M</span><span>营养配餐助手<small>MCDONALD\'S NUTRITION MCP</small></span></div>' +
        '<nav class="nav-links">' + links + "</nav>" +
      "</div>";
  }

  function mountFoot() {
    var el = document.getElementById("foot");
    if (!el) return;
    el.className = "foot";
    el.innerHTML =
      '<div class="wrap"><div class="in">' +
        '<div class="muted">数据快照：' + (D.generatedAt || "—") + " ｜ 来源：" + (D.source || "—") +
          "<br />调用方法：" + (D.method || "—") + "</div>" +
        '<div class="disclaimer"><b>以上数据来自麦当劳官方MCP接口，仅供点餐参考</b><br />本工具不做任何医疗、健康或治疗类诊断。</div>' +
      "</div></div>";
  }

  /* ---------- SVG 图表 ---------- */
  var gradSeq = 0;
  function ringSVG(percent, label, valueText, size) {
    size = size || 168;
    var r = size / 2 - 13, c = 2 * Math.PI * r;
    var p = Math.max(0, Math.min(1, percent));
    var gid = "rg" + (++gradSeq);
    return '<div class="ring-wrap" style="width:' + size + "px;height:" + size + 'px">' +
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '">' +
        "<defs><linearGradient id=\"" + gid + '" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0%" stop-color="#2b9dff"/><stop offset="70%" stop-color="#7fd8ff"/><stop offset="100%" stop-color="#ffc72c"/>' +
        "</linearGradient></defs>" +
        '<circle class="ring-bg" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-width="9"/>' +
        '<circle class="ring-fg" cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" stroke-width="9"' +
          ' stroke="url(#' + gid + ')" stroke-dasharray="' + c + '" stroke-dashoffset="' + (c * (1 - p)) + '"/>' +
      "</svg>" +
      '<div class="ring-center"><b>' + (valueText || Math.round(p * 100) + "%") + "</b><i>" + (label || "") + "</i></div>" +
    "</div>";
  }

  /* 占比解读文案（不重复百分比数字，交给调用方拼 pct） */
  function pctNote(pct, cap, unit) {
    var p = Math.round(pct);
    var ref = "每日上限 " + num(cap) + (unit ? " " + unit : "");
    if (pct > 100) return "已超出每日推荐上限 " + (p - 100) + "%，建议下调（" + ref + "）";
    if (p >= 85) return "已接近上限（" + ref + "）";
    if (p >= 35) return "处于合理区间（" + ref + "）";
    return "占比偏低（" + ref + "）";
  }

  /* 雷达图
     rows = [{ label, value, unit, cap }]
       cap = 该维度的每日推荐上限（如 热量 2000 / 钠 2000mg）
     顶点一律用「当前值 ÷ 每日上限 × 100%」的百分比绘制，不直接用原始数值 */
  function radarSVG(rows, size, opt) {
    opt = opt || {};
    size = size || 280;
    rows = rows || [];
    if (!rows.length) return '<div class="empty">暂无数据</div>';
    var n = rows.length, i;
    var cx = size / 2, cy = size / 2, R = 40;
    var PAD = 6;          /* 画布安全边距 */
    var EXT_MAX = 1.18;   /* 超过 100% 的顶点向外延伸到 118%（落在 100% 刻度环之外） */
    var GAP = 26;         /* 标签环与最外顶点之间的固定间隙（px）：保证文字不压到图形 */
    var LH = 12.5;        /* 标签三行行高（名称 / 数值 / 百分比） */
    var TOP_OFF = 22, BOT_OFF = 16;   /* 三行文字块相对锚点的上 / 下视觉外扩 */
    var FS_N = 11, FS_V = 10, FS_P = 10;

    function ang(k) { return -Math.PI / 2 + k * 2 * Math.PI / n; }
    function pt(k, ratio) {
      var a = ang(k);
      return [cx + Math.cos(a) * R * ratio, cy + Math.sin(a) * R * ratio];
    }
    function p2(p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }

    /* 1) 百分比口径不变：当前值 ÷ 每日推荐 × 100%；同时备好三行标签文本 */
    var verts = rows.map(function (r, idx) {
      var cap = r.cap || r.max || 1;
      var unit = r.unit || "";
      var pct = cap > 0 ? ((r.value || 0) / cap) * 100 : 0;
      var over = pct > 100.0001;
      var l1 = String(r.label == null ? "" : r.label);
      var l2 = num(r.value) + (unit ? " " + unit : "");
      var l3 = (over ? Math.round(pct) : num(pct, 1)) + "%";
      return {
        idx: idx, r: r, cap: cap, unit: unit, pct: pct, over: over,
        l1: l1, l2: l2, l3: l3,
        w: Math.max(textWidth(l1, FS_N), textWidth(l2, FS_V), textWidth(l3, FS_P)),
        ratio: Math.max(0.015, Math.min(EXT_MAX, pct / 100)),
        clipped: pct / 100 > EXT_MAX + 0.001
      };
    });

    /* 2) 由「文字不溢出画布」反推标签环半径 Lr，再据此定 100% 环半径 R（保证 GAP 间隙） */
    var halfW = 0;
    verts.forEach(function (v) { halfW = Math.max(halfW, v.w / 2); });
    var Lr = size;
    verts.forEach(function (v) {
      var a = ang(v.idx), c = Math.cos(a), s = Math.sin(a);
      if (Math.abs(c) > 1e-3) Lr = Math.min(Lr, (size / 2 - PAD - halfW) / Math.abs(c));
      if (s < -1e-3) Lr = Math.min(Lr, (cy - PAD - TOP_OFF) / -s);
      if (s > 1e-3) Lr = Math.min(Lr, (size - PAD - BOT_OFF - cy) / s);
    });
    Lr = Math.max(30, Math.min(Lr, size / 2 - 14));
    R = Math.max(20, (Lr - GAP) / EXT_MAX);

    var grid = [];
    /* 背景网格 = 同心圆：最外层画完整圆形轮廓（半径为顶点最大外扩半径，整体包住图形），
       向内多层细圆环做刻度分隔。圆心区域不写任何百分比文字，只留线条。
       与下面的红色虚线五边形（业务 100% 预警边界）共存：圆是背景辅助，五边形是预警线。 */
    var Ro = R * EXT_MAX;
    [1, 0.8, 0.6, 0.4, 0.2].forEach(function (k, idx) {
      var rr = Ro * k, outer = idx === 0;
      grid.push('<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + rr.toFixed(1) +
        '" fill="none" stroke="' + (outer ? "rgba(127,216,255,.30)" : "rgba(124,208,255,.10)") +
        '" stroke-width="' + (outer ? 1.3 : 1) + '"' + (outer ? "" : ' stroke-dasharray="2 4"') + '/>');
    });
    /* 轴线：画到外扩上限，保证超标顶点仍落在轴上 */
    for (i = 0; i < n; i++) {
      var e = pt(i, EXT_MAX);
      grid.push('<line x1="' + cx + '" y1="' + cy + '" x2="' + e[0].toFixed(1) + '" y2="' + e[1].toFixed(1) +
        '" stroke="rgba(124,208,255,.12)"/>');
    }
    /* 红色虚线五边形 = 100% 每日推荐预警边界（叠加在圆形网格内部） */
    var pent = [];
    for (i = 0; i < n; i++) pent.push(p2(pt(i, 1)));
    grid.push('<polygon points="' + pent.join(" ") + '" fill="none" stroke="rgba(255,90,95,.55)"' +
      ' stroke-width="1.4" stroke-dasharray="5 4"/>');

    var pts = [];
    verts.forEach(function (v) {
      v.p = pt(v.idx, v.ratio);
      pts.push(p2(v.p));
    });

    /* 主多边形：蓝色区域 = 当前套餐营养占比 */
    var poly = '<polygon points="' + pts.join(" ") + '" fill="rgba(43,157,255,.18)" stroke="#7fd8ff"' +
      ' stroke-width="2" stroke-linejoin="round"/>';
    /* 超标预警：超标顶点的相邻两条连线标红（外发光 + 实线两道） */
    var warn = "";
    verts.forEach(function (v) {
      if (!v.over) return;
      var a = verts[(v.idx - 1 + n) % n].p, b = verts[(v.idx + 1) % n].p;
      [[a, v.p], [v.p, b]].forEach(function (seg) {
        warn += '<line x1="' + seg[0][0].toFixed(1) + '" y1="' + seg[0][1].toFixed(1) + '" x2="' + seg[1][0].toFixed(1) +
          '" y2="' + seg[1][1].toFixed(1) + '" stroke="rgba(255,90,95,.22)" stroke-width="6" stroke-linecap="round"/>' +
          '<line x1="' + seg[0][0].toFixed(1) + '" y1="' + seg[0][1].toFixed(1) + '" x2="' + seg[1][0].toFixed(1) +
          '" y2="' + seg[1][1].toFixed(1) + '" stroke="#ff5a5f" stroke-width="2.4" stroke-linecap="round"/>';
      });
    });
    /* 顶点：命中区 r=12 便于悬浮，内圈为提示光晕，超标转红；被外扩上限截断时补一个向外箭头 */
    var dots = verts.map(function (v) {
      var note = pctNote(v.pct, v.cap, v.unit);
      var title = v.r.label + "：" + num(v.r.value) + " " + v.unit + "，占每日推荐 " + v.l3 +
        "（每日推荐 " + num(v.cap) + " " + v.unit + "），" + note;
      var u = [Math.cos(ang(v.idx)), Math.sin(ang(v.idx))];
      var arrowHead = "";
      if (v.clipped) {
        var r0 = R * EXT_MAX + 6, r1 = r0 + 7;
        var ax = cx + u[0] * r0, ay = cy + u[1] * r0, bx = cx + u[0] * r1, by = cy + u[1] * r1;
        var px = -u[1] * 3.6, py = u[0] * 3.6;
        arrowHead = '<line x1="' + ax.toFixed(1) + '" y1="' + ay.toFixed(1) + '" x2="' + bx.toFixed(1) +
            '" y2="' + by.toFixed(1) + '" stroke="#ff5a5f" stroke-width="1.6" stroke-linecap="round"/>' +
          '<polygon points="' + (bx + u[0] * 5).toFixed(1) + "," + (by + u[1] * 5).toFixed(1) + " " +
            (bx + px).toFixed(1) + "," + (by + py).toFixed(1) + " " + (bx - px).toFixed(1) + "," + (by - py).toFixed(1) +
            '" fill="#ff5a5f"/>';
      }
      return '<g class="rvert' + (v.over ? " over" : "") + '" data-name="' + esc(v.r.label) +
        '" data-value="' + esc(String(num(v.r.value))) + '" data-unit="' + esc(v.unit) +
        '" data-cap="' + esc(String(num(v.cap))) + '" data-pct="' + esc(v.l3) +
        '" data-key="占比解读" data-note="' + esc(note) +
        '" data-over="' + (v.over ? "1" : "0") + '">' +
        "<title>" + esc(title) + "</title>" +
        '<circle class="rhit" cx="' + v.p[0].toFixed(1) + '" cy="' + v.p[1].toFixed(1) +
          '" r="12" fill="transparent" pointer-events="all"/>' +
        '<circle cx="' + v.p[0].toFixed(1) + '" cy="' + v.p[1].toFixed(1) + '" r="' + (v.over ? 8 : 6.5) +
          '" fill="none" stroke="' + (v.over ? "#ff5a5f" : "rgba(255,199,44,.45)") + '" stroke-width="1.2"/>' +
        '<circle cx="' + v.p[0].toFixed(1) + '" cy="' + v.p[1].toFixed(1) + '" r="' + (v.over ? 4.6 : 3.6) +
          '" fill="' + (v.over ? "#ff5a5f" : "#ffc72c") + '" stroke="#06090e" stroke-width="1.6"/>' +
        arrowHead +
        "</g>";
    }).join("");

    /* 轴标签：名称 / 数值+单位 / 百分比 三行，整体居中在标签环上；
       半径由上方 Lr 保证「不溢出画布、不压住顶点」，暗色描边保证深色底可读 */
    function stext(x, y, s, fs, fill, weight, mono) {
      return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="middle" font-size="' + fs +
        '"' + (mono ? ' style="font-family:var(--mono)"' : "") + ' font-weight="' + weight +
        '" fill="' + fill + '" stroke="#05080d" stroke-width="2.8" stroke-linejoin="round" paint-order="stroke">' +
        esc(s) + "</text>";
    }
    var labels = verts.map(function (v) {
      var a = ang(v.idx);
      var lx = cx + Math.cos(a) * Lr, ly = cy + Math.sin(a) * Lr;
      var hw = v.w / 2;
      lx = Math.max(hw + PAD, Math.min(size - hw - PAD, lx));   /* 兜底：左右不溢出 */
      var cn = v.over ? "#ff9ba0" : "#a8c2da";
      var cv = v.over ? "#ff8f92" : "#dcecf9";
      var cp = v.over ? "#ff5a5f" : "#ffc72c";
      return stext(lx, ly - LH, v.l1, FS_N, cn, 600, false) +
             stext(lx, ly, v.l2, FS_V, cv, 400, true) +
             stext(lx, ly + LH, v.l3, FS_P, cp, 600, true);
    }).join("");

    initRadarTips();
    var svg = '<svg width="100%" viewBox="0 0 ' + size + " " + size + '" style="max-width:' + size +
      'px;margin:0 auto;display:block;overflow:visible">' +
      grid.join("") + poly + warn + dots + labels +
    "</svg>";

    /* 标题：默认「营养结构 · 占每日推荐 %」，opt.title = false 时由外层卡片标题承担 */
    var head = "";
    if (opt.title !== false) {
      head = '<div class="radar-title">' + esc(opt.title || "营养结构 · 占每日推荐 %") + "</div>";
    }
    /* 图例：默认只保留「蓝色区域 = 当前套餐营养占比」；
       opt.legend = "full" 时追加红色虚线（100% 参考边界）说明 */
    if (opt.legend === false) return head + svg;
    var items = ['<span class="rl-item"><i class="rl-sw rl-blue"></i>蓝色区域：当前套餐营养占比</span>'];
    if (opt.legend === "full") {
      items.push('<span class="rl-item"><i class="rl-sw rl-red"></i>红色虚线：100% 参考边界，超出即预警</span>');
    }
    return head + svg + '<div class="radar-legend">' + items.join("") + "</div>";
  }

  /* ---------- 图表悬浮提示（雷达顶点 / 散点，文档级委托，全局只绑一次） ---------- */
  var radarTipEl = null, radarTipBound = false, radarTipCur = null;
  function radarTipBox() {
    if (radarTipEl) return radarTipEl;
    radarTipEl = document.createElement("div");
    radarTipEl.className = "radar-tip";
    radarTipEl.setAttribute("role", "tooltip");
    radarTipEl.hidden = true;
    document.body.appendChild(radarTipEl);
    return radarTipEl;
  }
  function radarTipMove(x, y) {
    if (!radarTipEl || radarTipEl.hidden) return;
    var r = radarTipEl.getBoundingClientRect();
    var left = x + 16, top = y - r.height - 14;
    if (left + r.width > window.innerWidth - 8) left = Math.max(8, x - r.width - 16);
    if (top < 8) top = y + 20;
    radarTipEl.style.left = left + "px";
    radarTipEl.style.top = top + "px";
  }
  function radarTipShow(g, x, y) {
    var el = radarTipBox();
    if (radarTipCur !== g) {
      radarTipCur = g;
      var scatter = g.getAttribute("data-kind") === "scatter";
      var name = g.getAttribute("data-name") || "";
      var value = g.getAttribute("data-value") || "";
      var unit = g.getAttribute("data-unit") || "";
      var cap = g.getAttribute("data-cap") || "";
      var pct = g.getAttribute("data-pct") || "";
      var key = g.getAttribute("data-key") || "占比";
      var note = g.getAttribute("data-note") || "";
      var over = g.getAttribute("data-over") === "1";
      var gold = g.getAttribute("data-gold") === "1";

      /* 明细行：当前值 / 每日推荐值 / 占比（散点图无「每日推荐」维度，自动省略） */
      function row(k, v, u, cls) {
        return '<div class="rt-row"><span class="rt-k">' + esc(k) + "</span>" +
          '<span class="rt-val' + (cls ? " " + cls : "") + '">' + esc(v) +
          (u ? "<i>" + esc(u) + "</i>" : "") + "</span></div>";
      }
      var rows = row("当前值", value, unit);
      if (!scatter && cap) rows += row("每日推荐", cap, unit);
      if (pct) rows += row(key, pct, "", over ? "over" : "");

      el.innerHTML =
        '<div class="rt-h"><span class="rt-dot"></span>' + esc(name) + "</div>" +
        '<div class="rt-rows">' + rows + "</div>" +
        (gold ? '<div class="rt-n rt-gold">★ 最接近目标热量的单品</div>' : "") +
        (note ? '<div class="rt-n"><span class="rt-k">' + esc(scatter ? "每份营养" : "占比解读") + "</span>" +
          esc(note) + "</div>" : "");
      el.classList.toggle("gold", gold);
      el.classList.toggle("warn", over);
      el.hidden = false;
      el.style.left = "0px"; el.style.top = "0px";
    }
    radarTipMove(x, y);
  }
  function radarTipHide() {
    radarTipCur = null;
    if (radarTipEl) radarTipEl.hidden = true;
  }
  function initRadarTips() {
    if (radarTipBound || typeof document === "undefined" || !document.addEventListener) return;
    radarTipBound = true;
    /* 雷达顶点 .rvert / 散点 .svert 共用同一套提示 */
    function hit(e) { var t = e.target; return t && t.closest ? t.closest(".rvert, .svert") : null; }
    document.addEventListener("mouseover", function (e) {
      var g = hit(e);
      if (g) radarTipShow(g, e.clientX, e.clientY); else if (radarTipCur) radarTipHide();
    });
    document.addEventListener("mousemove", function (e) {
      var g = hit(e);
      if (g && radarTipCur === g) radarTipMove(e.clientX, e.clientY);
    });
    document.addEventListener("mouseout", function (e) {
      var g = hit(e);
      if (!g) return;
      var to = e.relatedTarget;
      if (to && to.closest && to.closest(".rvert, .svert") === g) return;
      radarTipHide();
    });
    window.addEventListener("scroll", radarTipHide, true);
  }

  /* 估算 SVG 文本宽度（viewBox 单位）：中日韩全角字符按 1em，其余按 0.56em */
  var WIDE_CHAR = /[\u1100-\u115F\u2E80-\u303F\u3040-\u30FF\u3130-\u318F\u3400-\u4DBF\u4E00-\u9FFF\uA960-\uA97F\uAC00-\uD7AF\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6\u2026]/;
  function textWidth(s, fs) {
    var w = 0;
    for (var i = 0; i < s.length; i++) w += WIDE_CHAR.test(s.charAt(i)) ? fs : fs * 0.56;
    return w;
  }

  /* 折线：rows = [{label, value}]，label 用完整名称，图表内部负责截断与防重叠 */
  function lineSVG(rows, opt) {
    opt = opt || {};
    var w = 640, h = opt.height || 190, pad = { l: 42, r: 16, t: 18, b: 30 };
    if (!rows.length) return "<div class='empty'>暂无数据</div>";
    var max = Math.max.apply(null, rows.map(function (r) { return r.value; })) * 1.15 || 1;
    var iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var step = rows.length > 1 ? iw / (rows.length - 1) : 0;
    var pts = rows.map(function (r, i) {
      return [pad.l + i * step, pad.t + ih - (r.value / max) * ih];
    });
    var path = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var area = path + " L" + pts[pts.length - 1][0].toFixed(1) + " " + (pad.t + ih) + " L" + pts[0][0].toFixed(1) + " " + (pad.t + ih) + " Z";
    var grid = [0, .25, .5, .75, 1].map(function (r) {
      var y = pad.t + ih * r;
      return '<line x1="' + pad.l + '" y1="' + y + '" x2="' + (w - pad.r) + '" y2="' + y + '" stroke="rgba(124,208,255,.10)"/>' +
             '<text x="' + (pad.l - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="#5f7691" font-family="monospace">' +
             num(max * (1 - r)) + "</text>";
    }).join("");
    /* X 轴标签：先截断到 maxChars，再按最宽标签推算最小间距，保证相邻标签不重叠 */
    var FS = 10, GAP = 12, maxChars = opt.labelMax == null ? 8 : opt.labelMax;
    var texts = rows.map(function (r) {
      var s = String(r.label == null ? "" : r.label);
      return s.length > maxChars ? s.slice(0, Math.max(1, maxChars - 1)) + "…" : s;
    });
    var widest = texts.reduce(function (m, s) { return Math.max(m, textWidth(s, FS)); }, 0);
    var pitch = widest + GAP;
    var stride = rows.length > 1 ? Math.max(1, Math.ceil(pitch / step)) : 1;
    var shown = [];
    for (var li = 0; li < rows.length; li += stride) shown.push(li);
    var lastIdx = rows.length - 1;
    /* 末点必须留标签（分布图的最高值最有信息量），若与前一个是挨太近就顶掉它 */
    if (lastIdx > 0 && shown[shown.length - 1] !== lastIdx) {
      if ((lastIdx - shown[shown.length - 1]) * step >= pitch) shown.push(lastIdx);
      else shown[shown.length - 1] = lastIdx;
    }
    /* 每个数据点都画一根刻度线，未标注文本的点也能看出有数据 */
    var ticks = rows.map(function (r, i) {
      var x = (pad.l + i * step).toFixed(1);
      return '<line x1="' + x + '" y1="' + (pad.t + ih) + '" x2="' + x + '" y2="' + (pad.t + ih + 4) +
             '" stroke="rgba(124,208,255,.20)"/>';
    }).join("");
    var labels = shown.map(function (i, k) {
      var x = pad.l + i * step, anchor = "middle";
      if (k === 0 && x - widest / 2 < 2) anchor = "start";
      else if (k === shown.length - 1 && x + widest / 2 > w - 2) anchor = "end";
      return '<text x="' + x.toFixed(1) + '" y="' + (h - 8) + '" text-anchor="' + anchor +
             '" font-size="' + FS + '" fill="#5f7691">' + esc(texts[i]) + "</text>";
    }).join("");
    return '<svg width="100%" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="xMidYMid meet">' +
      "<defs><linearGradient id=\"ag" + (++gradSeq) + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="rgba(127,216,255,.34)"/><stop offset="100%" stop-color="rgba(127,216,255,0)"/>' +
      "</linearGradient></defs>" + grid + ticks +
      '<path d="' + area + '" fill="url(#ag' + gradSeq + ')"/>' +
      '<path d="' + path + '" fill="none" stroke="#7fd8ff" stroke-width="2"/>' +
      pts.map(function (p, i) {
        var tip = esc(rows[i].label) + " · " + num(rows[i].value) + (opt.unit ? " " + esc(opt.unit) : "");
        return '<g class="pt"><title>' + tip + "</title>" +
          '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.5" fill="#06090e" stroke="' +
          (opt.goldIdx === i ? "#ffc72c" : "#7fd8ff") + '" stroke-width="2"/></g>';
      }).join("") + labels +
    "</svg>";
  }

  /* Y 轴刻度：按整步长铺，再补一个贴近峰值的整 50 刻度（707 → …、600、700） */
  function niceTicks(yMax, peak) {
    var step = yMax <= 200 ? 50 : (yMax <= 500 ? 100 : 200);
    var t = [];
    for (var v = 0; v <= yMax - step * 0.5; v += step) t.push(Math.round(v));
    var last = Math.floor((peak || 0) / 50) * 50;
    if (last > t[t.length - 1] + step * 0.4) t.push(last);
    return t;
  }

  /* 散点图：rows = [{label, value, protein, fat, sodium}]，每个单品是离散独立数据，不连折线。
     - 半透明蓝色填充区域保留（仅作量感底衬），去掉连续折线；
     - X 轴默认不铺满名称，只隔若干个点做倾斜标注，完整名称交给悬浮 tooltip；
     - goldIdx 标记最接近目标热量的单品（黄点 + 黄圈高亮）。 */
  function scatterSVG(rows, opt) {
    opt = opt || {};
    rows = rows || [];
    if (!rows.length) return "<div class='empty'>暂无数据</div>";
    var w = 660, h = opt.height || 244, pad = { l: 52, r: 18, t: 24, b: 56 };
    var unit = opt.unit || "kcal";
    var target = opt.target;
    var peak = Math.max.apply(null, rows.map(function (r) { return r.value || 0; }));
    var yMax = opt.yMax || Math.max(50, Math.ceil(peak * 1.06 / 50) * 50);
    var iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var step = rows.length > 1 ? iw / (rows.length - 1) : 0;
    var base = pad.t + ih;
    var X = function (i) { return pad.l + i * step; };
    var Y = function (v) { return pad.t + ih - (Math.min(Math.max(v, 0), yMax) / yMax) * ih; };

    var ticks = (opt.ticks && opt.ticks.length) ? opt.ticks : niceTicks(yMax, peak);
    var grid = ticks.map(function (v) {
      var y = Y(v);
      return '<line x1="' + pad.l + '" y1="' + y.toFixed(1) + '" x2="' + (w - pad.r) + '" y2="' + y.toFixed(1) +
             '" stroke="rgba(124,208,255,.10)"/>' +
             '<text x="' + (pad.l - 8) + '" y="' + (y + 3.5).toFixed(1) + '" text-anchor="end" font-size="10"' +
             ' style="font-family:var(--mono)" fill="#5f7691">' + num(v) + "</text>";
    }).join("");
    var axisUnit = '<text x="' + (pad.l - 8) + '" y="' + (pad.t - 9) + '" text-anchor="end" font-size="9.5"' +
      ' fill="rgba(95,118,145,.9)">' + esc(unit) + "</text>";
    var axis = '<line x1="' + pad.l + '" y1="' + pad.t + '" x2="' + pad.l + '" y2="' + base +
               '" stroke="rgba(124,208,255,.26)"/>' +
               '<line x1="' + pad.l + '" y1="' + base + '" x2="' + (w - pad.r) + '" y2="' + base +
               '" stroke="rgba(124,208,255,.26)"/>';

    /* 底部填充区域（无描边，只作分布量感） */
    var pts = rows.map(function (r, i) { return [X(i), Y(r.value || 0)]; });
    var area = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ") +
      " L" + pts[pts.length - 1][0].toFixed(1) + " " + base + " L" + pts[0][0].toFixed(1) + " " + base + " Z";

    /* 每个点一根 X 轴刻度线，标注文本只给抽样点 */
    var xticks = rows.map(function (r, i) {
      var x = X(i).toFixed(1);
      return '<line x1="' + x + '" y1="' + base + '" x2="' + x + '" y2="' + (base + 4) + '" stroke="rgba(124,208,255,.20)"/>';
    }).join("");

    /* 倾斜标注：相邻标签的垂直净距 = dx·sin(35°)，需 ≥ 行高，据此算抽稀步长 */
    var FS = 10, maxChars = opt.labelMax || 6;
    var texts = rows.map(function (r) {
      var s = String(r.label == null ? "" : r.label);
      return s.length > maxChars ? s.slice(0, Math.max(1, maxChars - 1)) + "…" : s;
    });
    var minDx = 26 / Math.sin(35 * Math.PI / 180);   /* 抽稀更激进：只留少量间隔标注 */
    var stride = Math.max(1, Math.ceil(minDx / (step || minDx)));
    var shown = [];
    for (var li = 0; li < rows.length; li += stride) shown.push(li);
    var lastIdx = rows.length - 1;
    if (lastIdx > 0 && shown[shown.length - 1] !== lastIdx) {
      if ((lastIdx - shown[shown.length - 1]) * step >= minDx * 0.8) shown.push(lastIdx);
      else shown[shown.length - 1] = lastIdx;
    }
    var xlabels = shown.map(function (i) {
      var y = base + 13;
      /* 倾斜后文字向左下伸展，左侧留够宽度避免被 viewBox 裁掉 */
      var x = Math.max(X(i), 0.82 * textWidth(texts[i], FS) + 2);
      x = Math.min(x, w - 4);
      return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" transform="rotate(-35 ' + x.toFixed(1) +
        " " + y.toFixed(1) + ')" text-anchor="end" font-size="' + FS + '" fill="#5f7691">' + esc(texts[i]) + "</text>";
    }).join("");

    /* 散点：普通浅蓝，目标最近点为金黄 + 外圈高亮 */
    var goldIdx = opt.goldIdx;
    var dots = rows.map(function (r, i) {
      var n = r.nutrition || {};
      var gold = i === goldIdx;
      var x = X(i).toFixed(1), y = Y(r.value || 0).toFixed(1);
      var pctTxt = (target && target > 0) ? Math.round((r.value || 0) / target * 100) + "%" : "";
      var note = ["蛋白 " + num(n.protein, 1) + "g", "脂肪 " + num(n.fat, 1) + "g", "钠 " + num(n.sodium) + "mg"].join(" · ");
      var title = (r.label || "单品") + "：" + num(r.value) + " " + unit + (note ? "，" + note : "");
      return '<g class="svert" data-kind="scatter" data-name="' + esc(r.label) + '" data-value="' + esc(String(num(r.value))) +
        '" data-unit="' + esc(unit) + '" data-pct="' + esc(pctTxt) +
        '" data-key="占目标" data-note="' + esc(note) + '" data-gold="' + (gold ? "1" : "0") + '">' +
        "<title>" + esc(title) + "</title>" +
        '<circle class="shit" cx="' + x + '" cy="' + y + '" r="11" fill="transparent" pointer-events="all"/>' +
        (gold ? '<circle cx="' + x + '" cy="' + y + '" r="9" fill="none" stroke="rgba(255,199,44,.45)" stroke-width="1.4"/>' : "") +
        '<circle cx="' + x + '" cy="' + y + '" r="' + (gold ? 4.6 : 3.4) +
          '" fill="' + (gold ? "#ffc72c" : "#0a121c") + '" stroke="' + (gold ? "#ffc72c" : "#7fd8ff") +
          '" stroke-width="' + (gold ? 1.6 : 1.8) + '"/>' +
      "</g>";
    }).join("");

    initRadarTips();
    return '<svg width="100%" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="xMidYMid meet">' +
      "<defs><linearGradient id=\"ag" + (++gradSeq) + '" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="rgba(127,216,255,.30)"/><stop offset="100%" stop-color="rgba(127,216,255,0)"/>' +
      "</linearGradient></defs>" + grid + axisUnit + axis + xticks +
      '<path d="' + area + '" fill="url(#ag' + gradSeq + ')"/>' +
      dots + xlabels +
    "</svg>";
  }

  /* ---------- 门店定位 / 直线距离 ----------
     接口 query-nearby-stores 本次快照里所有门店的 longitude / latitude 均为 0，
     无法直接拿经纬度算距离；distance 字段是抓取时的静态快照，也不是用户当前位置的距离。
     因此：优先用接口坐标；坐标为 0（缺失）时回落到按门店地址人工标注的近似坐标表。 */
  var STORE_GEO_FALLBACK = {
    "1990346": [118.7832, 32.0428],  /* 中山南路1号 · 新百中心店 */
    "1990043": [118.7870, 32.0402],  /* 洪武路119号 */
    "1990762": [118.7905, 32.0452],  /* 中山东路145号 */
    "1990675": [118.7790, 32.0405],  /* 淮海路88号苏宁广场 */
    "1990100": [118.7762, 32.0435]   /* 汉中路139-7号环亚广场 */
  };

  function validCoord(lng, lat) {
    lng = Number(lng); lat = Number(lat);
    if (!isFinite(lng) || !isFinite(lat)) return false;
    if (Math.abs(lng) < 1 || Math.abs(lat) < 1) return false;   /* 接口缺坐标时返回 0.0 */
    return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
  }
  /* 返回 {lng, lat, approx} 或 null（既无接口坐标也无兜底坐标） */
  function storeGeo(s) {
    if (!s) return null;
    if (validCoord(s.longitude, s.latitude)) {
      return { lng: Number(s.longitude), lat: Number(s.latitude), approx: false };
    }
    var f = STORE_GEO_FALLBACK[s.storeCode];
    if (f) return { lng: f[0], lat: f[1], approx: true };
    return null;
  }
  /* 球面直线距离（米），Haversine */
  function haversineM(a, b) {
    var R = 6371000, rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var s1 = Math.sin(dLat / 2), s2 = Math.sin(dLng / 2);
    var h = s1 * s1 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * s2 * s2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  }
  /* 距离文案：<1000m → XXm（整数）；≥1000m → XX.Xkm（保留 1 位小数） */
  function distText(m) {
    if (m == null || !isFinite(m) || m < 0) return "—";
    var r = Math.round(m);
    if (r < 1000) return r + "m";            /* 米取整 */
    return (m / 1000).toFixed(1) + "km";     /* 千米保留一位 */
  }
  /* 合理性阈值：超过 200km 视为坐标/定位异常（门店集中在同一城区），不再展示该距离 */
  var DIST_MAX_M = 200000;
  /* 营业状态：直接读接口 businessStatus */
  function storeStatus(s) {
    var open = !!s.businessStatus;
    return {
      open: open,
      text: open ? "营业中" : "已打烊",
      hours: (s.businessStartTime && s.businessEndTime) ? (s.businessStartTime + "-" + s.businessEndTime) : ""
    };
  }
  /* 按「用户坐标 ↔ 门店坐标」直线距离升序；
     有定位时用 GPS 距离；无定位时退回接口快照 distance 作为参考排序；
     距离超过 DIST_MAX_M 视为异常（坐标错位 / 定位漂移），丢弃不展示。 */
  function rankStores(stores, pos) {
    var hasPos = !!(pos && validCoord(pos.lng, pos.lat));
    /* 定位未就绪时，用接口快照 distance 参考排序（接口本身即按由近到远返回） */
    var useSnap = !hasPos;
    var out = (stores || []).map(function (s, i) {
      var o = {};
      for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) o[k] = s[k];
      var g = storeGeo(s);
      var snap = Number(s.distance);
      o.__idx = i;
      o.__geo = g;
      o.__approx = !!(g && g.approx);
      o.__snap = (isFinite(snap) && snap >= 0 && snap < DIST_MAX_M) ? snap : null;
      var d = (hasPos && g) ? haversineM({ lat: pos.lat, lng: pos.lng }, { lat: g.lat, lng: g.lng }) : null;
      /* 异常距离（数百/数千公里）直接判废，避免误导 */
      if (d != null && (!isFinite(d) || d > DIST_MAX_M)) { d = null; o.__far = true; }
      o.__dist = d;
      return o;
    });
    var key = function (o) {
      var v = useSnap ? o.__snap : o.__dist;
      return (v == null || !isFinite(v)) ? Number.POSITIVE_INFINITY : v;
    };
    out.sort(function (a, b) {
      var ka = key(a), kb = key(b);
      if (ka !== kb) return ka - kb;
      return a.__idx - b.__idx;
    });
    return out;
  }
  /* 按 storeCode 找门店；兼容旧的「索引」参数 */
  function storeByCode(code) {
    if (code == null || code === "") return null;
    code = String(code);
    for (var i = 0; i < STORES.length; i++) {
      if (String(STORES[i].storeCode) === code) return STORES[i];
    }
    var n = parseInt(code, 10);
    if (!isNaN(n) && STORES[n]) return STORES[n];
    return null;
  }
  /* 定位：resolve {lat,lng,accuracy}；reject {code, denied, message} */
  var GEO_ERR = {
    1: "请开启位置权限，获取附近门店",
    2: "定位获取失败，请手动选择门店",
    3: "定位超时，请手动选择门店"
  };
  function locate(opt) {
    opt = opt || {};
    return new Promise(function (resolve, reject) {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        reject({ code: 0, denied: false, message: "当前环境不支持定位，请手动选择门店" });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        function (p) {
          var lat = p && p.coords ? Number(p.coords.latitude) : NaN;
          var lng = p && p.coords ? Number(p.coords.longitude) : NaN;
          /* 坐标为 0 / 越界 / 非数字 → 判为定位结果异常，避免算出上百公里的错距离 */
          if (!validCoord(lng, lat)) {
            reject({ code: 0, denied: false, message: "定位结果异常（坐标为 0），请手动选择门店" });
            return;
          }
          resolve({
            lat: lat, lng: lng,
            accuracy: (p.coords.accuracy == null || !isFinite(p.coords.accuracy)) ? null : Number(p.coords.accuracy)
          });
        },
        function (e) {
          var code = e && e.code != null ? e.code : 0;
          reject({ code: code, denied: code === 1, message: GEO_ERR[code] || "定位获取失败，请手动选择门店" });
        },
        { enableHighAccuracy: true, timeout: opt.timeout || 8000, maximumAge: 60000 }
      );
    });
  }

  /* ---------- 导出 ---------- */
  window.MCD = {
    raw: D, nutrition: NUT, meals: MEALS, categories: CATS, stores: STORES,
    catalog: catalog, matchNutrition: matchNutrition, roleOf: roleOf,
    generatePlans: generatePlans, REF: REF, DAILY: DAILY, DAILY_UNIT: DAILY_UNIT, norm: norm,
    yuan: yuan, num: num, kcalOf: kcalOf, esc: esc, metric: metric,
    mountNav: mountNav, mountFoot: mountFoot,
    ringSVG: ringSVG, radarSVG: radarSVG, lineSVG: lineSVG, scatterSVG: scatterSVG,
    storeGeo: storeGeo, storeStatus: storeStatus, storeByCode: storeByCode,
    haversineM: haversineM, distText: distText, rankStores: rankStores,
    locate: locate, GEO_ERR: GEO_ERR, DIST_MAX_M: DIST_MAX_M, validCoord: validCoord
  };
})();

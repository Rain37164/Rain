(function () {
  "use strict";

  if (!window.MCD) return;

  var $ = function (id) { return document.getElementById(id); };
  var esc = MCD.esc, metric = MCD.metric;

  MCD.mountNav("results");
  MCD.mountFoot();

  var GOAL_TEXT = { balance: "均衡", cut: "减脂", bulk: "增肌" };
  var AVOID_TEXT = { beef: "牛肉", chicken: "鸡肉", fish: "鱼类", pork: "猪肉", fried: "油炸", sweet: "甜品", drink: "饮品" };

  var q = new URLSearchParams(location.search);
  var cfg = {
    kcal: parseInt(q.get("kcal") || "700", 10),
    goal: q.get("goal") || "balance",
    slot: q.get("slot") || "auto",
    avoid: (q.get("avoid") || "").split(",").filter(Boolean),
    store: q.get("store") || ""
  };
  if (isNaN(cfg.kcal)) cfg.kcal = 700;

  var store = MCD.storeByCode(cfg.store) || MCD.stores[0] || {};
  var goalText = GOAL_TEXT[cfg.goal] || "均衡";
  var avoidText = cfg.avoid.length
    ? cfg.avoid.map(function (a) { return AVOID_TEXT[a] || a; }).join(" / ")
    : "无";

  /* 条件行：cfg.slot 来自 URL 参数，必须转义 */
  $("condLine").innerHTML =
    "目标 <span class='mono hl-y'>" + cfg.kcal + " kcal</span> · 方向 <b class='hl-ice'>" + esc(goalText) +
    "</b> · 时段 " + esc(cfg.slot) + " · 忌口 " + esc(avoidText) +
    (store.storeName ? " · 门店 " + esc(store.storeName) : "");

  var plans = MCD.generatePlans({ kcal: cfg.kcal, goal: cfg.goal, avoid: cfg.avoid, count: 3 });

  $("planCount").textContent = plans.length ? "命中 " + plans.length + " 套 · 按匹配度排序" : "无符合方案";

  if (!plans.length) {
    $("plans").innerHTML =
      '<div class="holo flat"><div class="empty">' +
      "当前条件下没有热量误差在 ±100kcal 内的组合。<br />建议：放宽忌口条件，或把目标热量调整到 " +
      "<b class='hl-y'>" + Math.max(350, cfg.kcal - 150) + " ~ " + (cfg.kcal + 150) + " kcal</b> 区间后重试。" +
      "</div></div>";
  } else {
    $("plans").innerHTML = plans.map(renderPlan).join("");
  }

  function renderPlan(p, idx) {
    var badge = idx === 0 ? '<span class="tag gold">最优推荐</span>'
              : idx === 1 ? '<span class="tag">备选方案</span>'
              : '<span class="tag">第三方案</span>';

    /* 热量环形：超出目标时圆环封顶 100%，超出量改由文字标注（不出现 101%） */
    var over = p.kcal - cfg.kcal;                       /* >0 表示超出目标 */
    var pct = Math.round(p.kcal / cfg.kcal * 100);
    var ringRatio = Math.min(1, p.kcal / cfg.kcal);     /* 圆环最多画满一圈 */
    var centerText = over > 0 ? "100%" : pct + "%";
    var ringNote = over > 0
      ? "环形已封顶 100%（超出部分不再外扩）：实得 <b>" + Math.round(p.kcal) + "</b> kcal，" +
        "超出目标 <b>+" + Math.round(over) + " kcal</b>，在 ±100 kcal 容差内"
      : "实得 <b>" + Math.round(p.kcal) + "</b> kcal / 目标 <b>" + cfg.kcal + "</b> kcal，未超出目标（" + pct + "%）";

    var rows = p.items.map(function (i) {
      return '<div class="pick">' +
        (i.image ? '<img src="' + esc(i.image) + '" alt="' + esc(i.name) + '" loading="lazy">' : "") +
        '<div class="info"><b>' + esc(i.name) + '</b><small>' + esc(i.code) + " · " + MCD.num(i.nutrition.energyKcal) + " kcal · 蛋白 " +
        MCD.num(i.nutrition.protein, 1) + "g / 脂肪 " + MCD.num(i.nutrition.fat, 1) + "g / 碳水 " + MCD.num(i.nutrition.carbohydrate, 1) + "g" +
        (i.approx ? " · <span class='hl-y'>营养来源：" + esc(i.nutritionVia) + "</span>" : "") + "</small></div>" +
        '<div class="price">' + MCD.yuan(i.price) + "</div>" +
        '<a class="btn btn-ghost btn-sm" href="detail.html?code=' + encodeURIComponent(i.code) + '">拆解</a>' +
      "</div>";
    }).join("");

    /* 左列下方：小型营养雷达 + 占比条，填充留白并给出结构视角 */
    var radarRows = [
      { label: "热量", value: p.kcal, unit: "kcal", cap: MCD.DAILY.energyKcal },
      { label: "蛋白", value: p.protein, unit: "g", cap: MCD.DAILY.protein },
      { label: "脂肪", value: p.fat, unit: "g", cap: MCD.DAILY.fat },
      { label: "碳水", value: p.carb, unit: "g", cap: MCD.DAILY.carbohydrate },
      { label: "钠", value: p.sodium, unit: "mg", cap: MCD.DAILY.sodium }
    ];
    var bars = radarRows.map(function (r) {
      var v = Math.round((r.value / r.cap) * 1000) / 10;
      var ov = v > 100;
      return '<li>' +
        '<span class="nb-k">' + esc(r.label) + "</span>" +
        '<span class="nb-track"><i class="' + (ov ? "over" : "") + '" style="width:' +
          Math.max(1.5, Math.min(100, v)) + '%"></i></span>' +
        '<span class="nb-v' + (ov ? " over" : "") + '">' + MCD.num(v, 1) + "%</span>" +
      "</li>";
    }).join("");

    return '<div class="holo plan">' +
      '<div>' +
        '<h3 class="card-title"><span class="dot"></span><span>方案 ' + (idx + 1) + "</span>" +
          badge + '<span class="tag" style="margin-left:6px">实际偏差 ' + Math.round(p.dev) + " kcal</span></h3>" +
        '<div class="picks">' + rows + "</div>" +
        '<div class="plan-extra">' +
          '<div class="pe-radar">' +
            MCD.radarSVG(radarRows, 232) +
          "</div>" +
          '<ul class="pe-bars">' + bars + "</ul>" +
        "</div>" +
      "</div>" +
      '<div>' +
        '<div class="center-flex">' + MCD.ringSVG(ringRatio, "热量达成", centerText, 148) + "</div>" +
        '<p class="mt-8 ring-note center">' + ringNote + "</p>" +
        '<div class="metrics two mt-16">' +
          metric("总热量", Math.round(p.kcal), "kcal", true) +
          metric("参考总价", MCD.yuan(p.price), "", true) +
          metric("蛋白质", MCD.num(p.protein, 1), "g", p.protein >= 25) +
          metric("脂肪", MCD.num(p.fat, 1), "g", false) +
          metric("碳水", MCD.num(p.carb, 1), "g", false) +
          metric("钠", MCD.num(p.sodium), "mg", p.sodium > 1800) +
        "</div>" +
        '<p class="mt-16 hint">推荐理由：' + esc(reason(p, cfg, goalText)) + "</p>" +
      "</div>" +
    "</div>";
  }

  function reason(p, cfg, goalText) {
    var parts = [];
    var dev = Math.round(p.dev);
    var dir = p.kcal > cfg.kcal ? "高于目标" : (p.kcal < cfg.kcal ? "低于目标" : "与目标持平");
    /* 明确区分「容差上限」（系统硬约束 ±100）与「本次实际偏差」（该方案真实误差） */
    parts.push("容差上限 ±100 kcal；本次实际偏差 " + dev + " kcal（实得 " + Math.round(p.kcal) +
      " kcal，" + dir + "，已落在容差范围内）");
    if (cfg.goal === "cut") parts.push("脂肪 " + MCD.num(p.fat, 1) + "g、钠 " + MCD.num(p.sodium) + "mg，控制在减脂友好区间");
    else if (cfg.goal === "bulk") parts.push("蛋白质 " + MCD.num(p.protein, 1) + "g，优先满足增肌需求");
    else parts.push("蛋白 " + MCD.num(p.protein, 1) + "g / 脂肪 " + MCD.num(p.fat, 1) + "g / 碳水 " + MCD.num(p.carb, 1) + "g，三大营养素均衡");
    parts.push("共 " + p.items.length + " 件，参考价 " + MCD.yuan(p.price));
    if (p.sodium > 1800) parts.push("钠含量偏高，建议当天其余餐次注意控盐");
    return parts.join("；") + "。";
  }

  /* 全部可求解餐品表 */
  var cat = MCD.catalog().slice().sort(function (a, b) { return (b.nutrition.energyKcal || 0) - (a.nutrition.energyKcal || 0); });
  $("catCount").textContent = cat.length + " 款（门店在售 " + Object.keys(MCD.meals).length + " 款中有官方营养数据者）";
  document.querySelector("#catTable tbody").innerHTML = cat.map(function (i) {
    var n = i.nutrition;
    return "<tr>" +
      "<td>" + esc(i.name) + "</td>" +
      '<td class="mono">' + esc(i.code) + "</td>" +
      '<td class="num hi">' + MCD.num(n.energyKcal) + "</td>" +
      '<td class="num">' + MCD.num(n.protein, 1) + "</td>" +
      '<td class="num">' + MCD.num(n.fat, 1) + "</td>" +
      '<td class="num">' + MCD.num(n.carbohydrate, 1) + "</td>" +
      '<td class="num">' + MCD.num(n.sodium) + "</td>" +
      '<td class="num">' + MCD.yuan(i.price) + "</td>" +
      "<td>" + (i.approx ? '<span class="tag gold">' + esc(i.nutritionVia) + "</span>" : '<span class="tag ok">同名匹配</span>') + "</td>" +
    "</tr>";
  }).join("");
})();

(function () {
  "use strict";

  if (!window.MCD) return;

  var $ = function (id) { return document.getElementById(id); };
  var esc = MCD.esc, metric = MCD.metric;
  var GOAL_TEXT = { balance: "均衡", cut: "减脂", bulk: "增肌" };

  MCD.mountNav("dashboard");
  MCD.mountFoot();

  var q = new URLSearchParams(location.search);
  var cfg = {
    kcal: parseInt(q.get("kcal") || "700", 10),
    goal: q.get("goal") || "balance",
    avoid: (q.get("avoid") || "").split(",").filter(Boolean),
    store: q.get("store") || ""
  };
  if (isNaN(cfg.kcal)) cfg.kcal = 700;

  var store = MCD.storeByCode(cfg.store) || MCD.stores[0] || {};
  var cat = MCD.catalog();
  var plans = MCD.generatePlans({ kcal: cfg.kcal, goal: cfg.goal, avoid: cfg.avoid, count: 3 });
  var best = plans[0] || null;

  $("condLine").innerHTML =
    "目标 <span class='mono hl-y'>" + cfg.kcal + " kcal</span> · 方向 " + esc(GOAL_TEXT[cfg.goal] || "均衡") +
    (store.storeName ? " · 门店 " + esc(store.storeName) : "");

  var totKcal = cat.reduce(function (s, i) { return s + (i.nutrition.energyKcal || 0); }, 0);
  $("topMetrics").innerHTML =
    metric("门店在售", Object.keys(MCD.meals).length, "款", false) +
    metric("可配餐单品", cat.length, "款", false) +
    metric("官方营养数据", MCD.nutrition.length, "条", false) +
    metric("命中方案", plans.length, "套", plans.length > 0) +
    metric("菜单均热量", Math.round(totKcal / (cat.length || 1)), "kcal", false) +
    metric("最优方案热量", best ? Math.round(best.kcal) : "—", "kcal", true);

  /* 环形 */
  var pct = best ? Math.max(0, Math.min(1.15, best.kcal / cfg.kcal)) : 0;
  var ringBox = $("bigRing");
  ringBox.innerHTML = MCD.ringSVG(pct, "目标达成", best ? Math.round(pct * 100) + "%" : "—", 210);
  ringBox.setAttribute("aria-label", best
    ? "目标热量达成 " + Math.round(pct * 100) + "%，最优方案 " + Math.round(best.kcal) + " 千卡，误差 " + Math.round(best.dev) + " 千卡"
    : "当前条件下无可行方案");
  $("ringTag").textContent = best ? "误差 " + Math.round(best.dev) + " kcal" : "无解";
  $("ringNote").innerHTML = best
    ? "最优方案共 " + best.items.length + " 件，合计 <b class='hl-y'>" + Math.round(best.kcal) +
      " kcal</b>，与目标差 " + Math.round(best.dev) + " kcal（容差 ±100）。"
    : "当前条件下无解，请调整目标热量或放宽忌口。";

  /* 雷达 */
  var D = MCD.DAILY;
  var radarRows = best ? [
    { label: "热量", value: best.kcal, unit: "kcal", cap: D.energyKcal },
    { label: "蛋白", value: best.protein, unit: "g", cap: D.protein },
    { label: "脂肪", value: best.fat, unit: "g", cap: D.fat },
    { label: "碳水", value: best.carb, unit: "g", cap: D.carbohydrate },
    { label: "钠", value: best.sodium, unit: "mg", cap: D.sodium }
  ] : [];
  var radarBox = $("bigRadar");
  radarBox.innerHTML = MCD.radarSVG(radarRows, 300, { title: false, legend: "full" });
  radarBox.setAttribute("aria-label", radarRows.length
    ? "宏量营养素雷达，顶点为占每日推荐摄入量的百分比：" + radarRows.map(function (r) {
        return r.label + " " + MCD.num(r.value) + " " + r.unit + "，上限 " + r.cap + " " + r.unit +
          "，占 " + Math.round(r.value / r.cap * 100) + "%";
      }).join("；")
    : "暂无方案数据");

  /* 热量分布散点图（单品为离散数据，不用连续折线） */
  var sorted = cat.slice().sort(function (a, b) { return (a.nutrition.energyKcal || 0) - (b.nutrition.energyKcal || 0); });
  var distBox = $("distScatter");
  if (sorted.length) {
    var nearestIdx = 0, nd = Infinity;
    sorted.forEach(function (i, idx) {
      var d = Math.abs((i.nutrition.energyKcal || 0) - cfg.kcal);
      if (d < nd) { nd = d; nearestIdx = idx; }
    });
    var lo = Math.round(sorted[0].nutrition.energyKcal);
    var hi = Math.round(sorted[sorted.length - 1].nutrition.energyKcal);
    distBox.innerHTML = MCD.scatterSVG(
      sorted.map(function (i) {
        return {
          label: i.name, value: i.nutrition.energyKcal || 0,
          nutrition: { protein: i.nutrition.protein || 0, fat: i.nutrition.fat || 0, sodium: i.nutrition.sodium || 0 }
        };
      }),
      { goldIdx: nearestIdx, height: 240, unit: "kcal", target: cfg.kcal });
    distBox.setAttribute("aria-label",
      "门店 " + sorted.length + " 款餐品的热量分布散点图，按热量升序排列，最低 " + lo + " 千卡，最高 " + hi +
      " 千卡；最接近目标 " + cfg.kcal + " 千卡的是" + sorted[nearestIdx].name);
    $("distTag").textContent = sorted.length + "款 · 最低" + lo + " / 最高" + hi + " kcal";
  } else {
    distBox.innerHTML = '<div class="empty">暂无数据</div>';
  }

  /* 缺口 / 超标 */
  var gaps = [];
  if (best) {
    gaps.push(["热量", best.kcal, MCD.REF.energyKcal, "kcal"]);
    gaps.push(["蛋白质", best.protein, MCD.REF.protein, "g"]);
    gaps.push(["脂肪", best.fat, MCD.REF.fat, "g"]);
    gaps.push(["碳水化合物", best.carb, MCD.REF.carbohydrate, "g"]);
    gaps.push(["钠", best.sodium, MCD.REF.sodium, "mg"]);
  }
  $("gaps").innerHTML = gaps.length ? gaps.map(function (g, i) {
    var ratio = (g[1] || 0) / g[2];
    var over = ratio > 1;
    var stateText = over ? "超出参考 " + Math.round((ratio - 1) * 100) + "%" : "缺口 " + Math.round((1 - ratio) * 100) + "%";
    return '<div class="layer' + (over ? " over" : "") + '">' +
      '<div class="ly-idx">' + (over ? "超标" : "缺口") + "</div>" +
      '<div><div class="ly-nm">' + esc(g[0]) + '</div><div class="ly-bar"><i style="width:' + Math.min(100, ratio * 100) + '%"></i></div></div>' +
      '<div class="ly-val">' + MCD.num(g[1], g[3] === "g" ? 1 : 0) + " " + g[3] +
      "<small>" + stateText + "</small></div></div>";
  }).join("") : '<div class="empty">暂无方案可分析</div>';

  /* 品类均值 */
  var byCat = {};
  MCD.categories.forEach(function (c) {
    (c.meals || []).forEach(function (mc) {
      var it = cat.filter(function (x) { return x.code === mc.code; })[0];
      if (!it) return;
      var key = c.name.replace(/\n/g, "");
      (byCat[key] = byCat[key] || []).push(it.nutrition);
    });
  });
  var rows = Object.keys(byCat).map(function (k) {
    var arr = byCat[k];
    var avg = function (f) { return arr.reduce(function (s, n) { return s + (n[f] || 0); }, 0) / arr.length; };
    return { name: k, n: arr.length, kcal: avg("energyKcal"), pro: avg("protein"), na: avg("sodium") };
  }).sort(function (a, b) { return b.kcal - a.kcal; });
  document.querySelector("#catTable tbody").innerHTML = rows.map(function (r) {
    return "<tr><td>" + esc(r.name) + '</td><td class="num">' + r.n + '</td><td class="num hi">' + Math.round(r.kcal) +
      '</td><td class="num">' + MCD.num(r.pro, 1) + '</td><td class="num">' + Math.round(r.na) + "</td></tr>";
  }).join("") || '<tr><td colspan="5" class="empty">暂无数据</td></tr>';

  /* TOP 高热量 */
  $("topMeals").innerHTML = cat.slice()
    .sort(function (a, b) { return (b.nutrition.energyKcal || 0) - (a.nutrition.energyKcal || 0); })
    .slice(0, 8)
    .map(function (i) {
      return '<a class="holo meal-card card-link" href="detail.html?code=' + encodeURIComponent(i.code) + '">' +
        '<div class="thumb">' + (i.image ? '<img src="' + esc(i.image) + '" alt="' + esc(i.name) + '" loading="lazy">' : "") + "</div>" +
        '<div class="nm">' + esc(i.name) + "</div>" +
        '<div class="row between" style="align-items:center">' +
          '<span class="pr">' + MCD.yuan(i.price) + "</span>" +
          '<span class="tag gold">' + MCD.num(i.nutrition.energyKcal) + " kcal</span></div>" +
        '<span class="muted">钠 ' + MCD.num(i.nutrition.sodium) + " mg · 脂肪 " + MCD.num(i.nutrition.fat, 1) + " g</span>" +
      "</a>";
    }).join("");
})();

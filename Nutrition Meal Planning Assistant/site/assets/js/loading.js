(function () {
  "use strict";

  if (!window.MCD) return;

  var $ = function (id) { return document.getElementById(id); };

  MCD.mountNav("loading");
  MCD.mountFoot();

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

  var STEPS = [
    "读取门店信息 · query-nearby-stores",
    "载入官方营养数据 · list-nutrition-foods",
    "拉取门店在售菜单 · query-meals",
    "名称对齐：菜单 × 营养表",
    "遍历套餐组合，筛选 ±100kcal",
    "计算营养全貌与参考价格",
    "生成方案完成"
  ];

  var cat = MCD.catalog();
  var plans = MCD.generatePlans({ kcal: cfg.kcal, goal: cfg.goal, avoid: cfg.avoid, count: 3 });

  $("liveMetrics").innerHTML =
    '<div class="metric ice"><div class="k">目标热量</div><div class="v">' + cfg.kcal + '<span class="u">kcal</span></div></div>' +
    '<div class="metric"><div class="k">营养数据</div><div class="v">' + MCD.nutrition.length + '<span class="u">条</span></div></div>' +
    '<div class="metric"><div class="k">可求解餐品</div><div class="v">' + cat.length + '<span class="u">款</span></div></div>' +
    '<div class="metric hi"><div class="k">命中方案</div><div class="v">' + plans.length + '<span class="u">套</span></div></div>';

  var i = 0;
  var bar = $("bar");
  var track = $("track");
  var pctEl = $("pct");
  var stepEl = $("stepText");

  var timer = setInterval(function () {
    i++;
    var p = Math.round(i / STEPS.length * 100);
    bar.style.width = p + "%";
    pctEl.textContent = p + "%";
    track.setAttribute("aria-valuenow", p);
    if (i <= STEPS.length) {
      stepEl.textContent = STEPS[i - 1] + (store.storeName ? "　· " + store.storeName : "");
    }
    if (i >= STEPS.length) {
      clearInterval(timer);
      setTimeout(function () {
        location.replace("results.html?" + q.toString());
      }, 480);
    }
  }, 420);
})();

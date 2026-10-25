(function () {
  "use strict";

  if (!window.MCD) return;

  var $ = function (id) { return document.getElementById(id); };
  var esc = MCD.esc, metric = MCD.metric;

  MCD.mountNav("detail");
  MCD.mountFoot();

  var q = new URLSearchParams(location.search);
  var code = q.get("code");
  var cat = MCD.catalog();
  var item = cat.filter(function (i) { return i.code === code; })[0] || cat[0];

  if (!item) {
    $("mealName").textContent = "暂无数据";
    return;
  }

  var n = item.nutrition;
  $("mealName").textContent = item.name;
  $("mealMeta").innerHTML =
    "菜单编码 <span class='mono hl-ice'>" + esc(item.code) + "</span> · 参考价 <b class='hl-y'>" +
    MCD.yuan(item.price) + "</b>" +
    (item.originalPrice > item.price ? "（原价 " + MCD.yuan(item.originalPrice) + "）" : "") +
    (item.discountType ? " · " + esc(item.discountType) : "");

  $("matchTag").textContent = item.approx ? "营养来源：" + item.nutritionVia : "同名精确匹配";
  $("nKcal").textContent = MCD.num(n.energyKcal) + " kcal";
  $("nProtein").textContent = MCD.num(n.protein, 1) + " g";
  $("nFat").textContent = MCD.num(n.fat, 1) + " g";
  $("nCarb").textContent = MCD.num(n.carbohydrate, 1) + " g";

  $("nutMetrics").innerHTML =
    metric("热量", MCD.num(n.energyKcal), "kcal", true) +
    metric("蛋白质", MCD.num(n.protein, 1), "g", false) +
    metric("脂肪", MCD.num(n.fat, 1), "g", false) +
    metric("碳水", MCD.num(n.carbohydrate, 1), "g", false) +
    metric("钠", MCD.num(n.sodium), "mg", n.sodium > 800) +
    metric("钙", MCD.num(n.calcium), "mg", false);

  var ratioKcal = (n.energyKcal || 0) / MCD.REF.energyKcal;
  var ringBox = $("ringBox");
  ringBox.innerHTML = MCD.ringSVG(Math.min(1.2, ratioKcal), "占参考热量", MCD.num(n.energyKcal), 160);
  ringBox.setAttribute("aria-label",
    "占单人单餐参考热量的比例：" + MCD.num(n.energyKcal) + " 千卡，为参考值 " + MCD.REF.energyKcal + " 千卡的 " + Math.round(ratioKcal * 100) + "%");

  var bars = [
    ["热量", n.energyKcal, MCD.REF.energyKcal, "kcal"],
    ["蛋白质", n.protein, MCD.REF.protein, "g"],
    ["脂肪", n.fat, MCD.REF.fat, "g"],
    ["碳水化合物", n.carbohydrate, MCD.REF.carbohydrate, "g"],
    ["钠", n.sodium, MCD.REF.sodium, "mg"],
    ["钙", n.calcium, MCD.REF.calcium, "mg"]
  ];
  $("bars").innerHTML = bars.map(function (b, i) {
    var ratio = (b[1] || 0) / b[2];
    var over = ratio > 1;
    return '<div class="layer' + (over ? " over" : "") + '">' +
      '<div class="ly-idx">0' + (i + 1) + "</div>" +
      '<div><div class="ly-nm">' + esc(b[0]) + '</div><div class="ly-bar"><i style="width:' + Math.min(100, ratio * 100) + '%"></i></div></div>' +
      '<div class="ly-val">' + MCD.num(b[1], b[3] === "g" ? 1 : 0) + " " + b[3] +
        "<small>参考 " + b[2] + " " + b[3] + " · " + Math.round(ratio * 100) + "%</small></div>" +
    "</div>";
  }).join("");

  /* ---------- 横向条形对比图（左列留白区）：当前值 vs 参考值 ----------
     视觉与右侧「相对参考值占比」进度条统一：未超标浅蓝 / 超标橙 / 空数据灰色占位。
     轨道满刻度 = 参考值 × 1.3，白色虚线固定在参考值（100%）位置；
     条形从 0 平滑生长，切换对比餐品时重新生长（CSS transition）。 */
  var CMP = [
    ["热量", "energyKcal", "kcal"],
    ["蛋白质", "protein", "g"],
    ["脂肪", "fat", "g"],
    ["碳水化合物", "carbohydrate", "g"],
    ["钠", "sodium", "mg"],
    ["钙", "calcium", "mg"]
  ];
  var CMP_SCALE = 1.3, REF_POS = (100 / CMP_SCALE).toFixed(1) + "%";
  var cmpChart = $("cmpChart"), cmpSel = $("cmpSel"), cmpTip = null;

  function cmpRows(it) {
    return CMP.map(function (c, i) {
      var v = it.nutrition ? it.nutrition[c[1]] : null;
      var ref = MCD.REF[c[1]];
      var valid = v != null && !isNaN(v);
      var ratio = valid ? v / ref : 0;
      var over = valid && ratio > 1;
      var w = valid ? Math.min(ratio, CMP_SCALE) / CMP_SCALE * 100 : 100;   /* 空数据 = 灰色占位条铺满 */
      return {
        i: i, name: c[0], v: v, ref: ref, unit: c[2], valid: valid, over: over, w: w,
        valTxt: valid ? MCD.num(v, c[2] === "g" ? 1 : 0) + " " + c[2] : "--",
        refTxt: "参考 " + ref + " " + c[2],
        pctTxt: valid ? Math.round(ratio * 100) + "%" : "--"
      };
    });
  }

  function renderCompare(it) {
    cmpChart.innerHTML = cmpRows(it).map(function (r) {
      return '<div class="cmp-row' + (r.over ? " over" : "") + (r.valid ? "" : " none") +
          '" data-i="' + r.i + '"' +
          ' data-name="' + esc(r.name) + '" data-val="' + esc(r.valTxt) +
          '" data-ref="' + esc(r.refTxt) + '" data-pct="' + esc(r.pctTxt) + '">' +
        '<div class="cmp-idx">' + ("0" + (r.i + 1)).slice(-2) + "</div>" +
        '<div><div class="cmp-top"><span class="cmp-nm">' + esc(r.name) +
            '</span><span class="cmp-pct">' + esc(r.pctTxt) + "</span></div>" +
          '<div class="cmp-track"><i class="cmp-refline" style="left:' + REF_POS + '"></i>' +
            '<i class="cmp-bar" data-w="' + r.w.toFixed(1) + '"></i></div></div>' +
        '<div class="cmp-val">' + esc(r.valTxt) + "<small>" + esc(r.refTxt) + "</small></div>" +
      "</div>";
    }).join("");
    /* 条形从 0 平滑生长到目标宽度 */
    var bars = cmpChart.querySelectorAll(".cmp-bar");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        Array.prototype.forEach.call(bars, function (el) {
          el.style.width = el.getAttribute("data-w") + "%";
        });
      });
    });
    cmpChart.setAttribute("aria-label",
      it.name + "：六项营养指标与单人单餐参考值的横向条形对比图");
  }

  /* 对比餐品切换：默认当前单品，切换后就地重渲染并平滑动画 */
  if (cmpSel && cmpChart) {
    cmpSel.innerHTML = cat.map(function (i) {
      return '<option value="' + esc(i.code) + '">' + esc(i.name) + "</option>";
    }).join("");
    cmpSel.value = item.code;
    renderCompare(item);
    cmpSel.addEventListener("change", function () {
      var t = cat.filter(function (i) { return i.code === cmpSel.value; })[0];
      if (t) renderCompare(t);
    });
    if (cmpSel.value !== item.code) cmpSel.value = item.code;   /* 重复名兜底 */

    /* 悬浮提示：指标名称 / 当前数值 / 参考值 / 占比 */
    function tipBox() {
      if (!cmpTip) {
        cmpTip = document.createElement("div");
        cmpTip.className = "cmp-tip";
        cmpTip.hidden = true;
        document.body.appendChild(cmpTip);
      }
      return cmpTip;
    }
    cmpChart.addEventListener("mouseover", function (e) {
      var row = e.target.closest ? e.target.closest(".cmp-row") : null;
      if (!row) return;
      var tip = tipBox();
      tip.innerHTML =
        "<b>" + esc(row.getAttribute("data-name")) + "</b>" +
        '<div class="ct-rows">' +
          '<div class="ct-row"><i>当前数值</i><b>' + esc(row.getAttribute("data-val")) + "</b></div>" +
          '<div class="ct-row"><i>参考值</i><b>' + esc(row.getAttribute("data-ref")) + "</b></div>" +
          '<div class="ct-row"><i>占比</i><b>' + esc(row.getAttribute("data-pct")) + "</b></div>" +
        "</div>";
      tip.classList.toggle("over", row.classList.contains("over"));
      tip.hidden = false;
      tipMove(e);   /* 立即定位：否则首悬浮（未移动鼠标）时弹窗停在文档末尾不可见 */
      cmpChart.addEventListener("mousemove", tipMove);
    });
    function tipMove(e) {
      if (!cmpTip || cmpTip.hidden) return;
      var r = cmpTip.getBoundingClientRect();
      var left = e.clientX + 16, top = e.clientY - r.height - 14;
      if (left + r.width > window.innerWidth - 8) left = Math.max(8, e.clientX - r.width - 16);
      if (top < 8) top = e.clientY + 18;
      cmpTip.style.left = left + "px";
      cmpTip.style.top = top + "px";
    }
    cmpChart.addEventListener("mouseout", function (e) {
      if (!e.relatedTarget || !cmpChart.contains(e.relatedTarget)) {
        if (cmpTip) cmpTip.hidden = true;
        cmpChart.removeEventListener("mousemove", tipMove);
      }
    });
    window.addEventListener("scroll", function () { if (cmpTip) cmpTip.hidden = true; }, true);
  }

  /* 套餐组成（若已抓取 query-meal-detail） */
  var det = (window.MCD_DETAILS || {})[item.code];
  if (det && det.data) {
    var box = $("comboBox");
    box.hidden = false;
    var d = det.data;
    var rounds = d.rounds || [];
    var mods = (d.modification && d.modification.items) || [];
    var html = "";
    if (rounds.length) {
      html += rounds.map(function (r) {
        var list = (r.comboItemList || r.items || []);
        if (!list.length) return "";
        return '<div class="mt-8"><span class="tag">' + esc(r.roundName || r.round || "子项") + "</span>" +
          '<div class="picks mt-8">' + list.map(function (c) {
            return '<div class="pick"><div class="info"><b>' + esc(c.name || c.productName || c.code) +
              "</b><small>编码 " + esc(c.code || c.productCode) + " × " + esc(c.quantity || 1) + "</small></div></div>";
          }).join("") + "</div></div>";
      }).join("");
    }
    if (mods.length) {
      html += '<div class="mt-16"><span class="tag gold">可特制项</span><div class="chips mt-8">' +
        mods.map(function (g) {
          return (g.values || []).map(function (v) {
            return '<span class="chip">' + esc(v.name) + (v.price ? " +" + MCD.yuan(v.price) : "") + "</span>";
          }).join("");
        }).join("") + "</div></div>";
    }
    $("comboList").innerHTML = html || '<div class="empty">该餐品无套餐子项</div>';
  }

  /* 同类对比：按热量接近程度取前 4 */
  $("peers").innerHTML = cat
    .filter(function (i) { return i.code !== item.code; })
    .sort(function (a, b) {
      return Math.abs((a.nutrition.energyKcal || 0) - (n.energyKcal || 0)) - Math.abs((b.nutrition.energyKcal || 0) - (n.energyKcal || 0));
    })
    .slice(0, 4)
    .map(function (i) {
      var link = "detail.html?code=" + encodeURIComponent(i.code);
      return '<a class="holo meal-card card-link" href="' + link + '">' +
        '<div class="thumb">' + (i.image ? '<img src="' + esc(i.image) + '" alt="' + esc(i.name) + '" loading="lazy">' : esc(i.name.slice(0, 2))) + "</div>" +
        '<div class="nm">' + esc(i.name) + "</div>" +
        '<div class="row between" style="align-items:center">' +
          '<span class="pr">' + MCD.yuan(i.price) + "</span>" +
          '<span class="tag gold">' + MCD.num(i.nutrition.energyKcal) + " kcal</span>" +
        "</div>" +
      "</a>";
    }).join("");

  document.title = item.name + " · 单品营养详情 | 麦当劳营养配餐助手";
})();

(function () {
  "use strict";

  if (!window.MCD) return;

  var $ = function (id) { return document.getElementById(id); };
  var esc = MCD.esc, metric = MCD.metric;

  MCD.mountNav("index");
  MCD.mountFoot();

  /* ---------- 静态头部信息 ---------- */
  $("srcCount").textContent = MCD.nutrition.length + " 条官方营养数据";
  $("srcCount").style.color = "var(--ice)";

  $("homeMetrics").innerHTML =
    metric("可求解餐品", MCD.catalog().length, "款", false) +
    metric("门店在售", Object.keys(MCD.meals).length, "款", false) +
    metric("附近门店", MCD.stores.length, "家", false) +
    metric("营养数据", MCD.nutrition.length, "条", false);

  /* ---------- 门店选择器：GPS 定位 → 直线距离 → 升序列表 ---------- */
  var storeBtn = $("storeBtn"), storeList = $("storeList"), storeValue = $("storeValue"),
      storeMeta = $("storeMeta"), storeHint = $("storeHint"), storeLive = $("storeLive"),
      storeRefresh = $("storeRefresh"), geoModal = $("geoModal"),
      storePanel = $("storePanel"), storeRow = $("storeRow"),
      storeSearch = $("storeSearch"), storeClear = $("storeSearchClear"),
      storeCount = $("storeCount");

  var ranked = [];        /* 按距离升序的门店副本 */
  var selected = null;    /* 当前选中的门店（ranked 里的对象） */
  var picked = false;     /* 用户是否手动选过（选过则刷新定位不覆盖） */
  var myPos = null;       /* 用户坐标 */
  var locating = false;
  var autoTried = false;  /* 首次展开下拉时自动请求定位，只做一次，避免反复弹权限 */
  var cursor = -1;        /* 键盘高亮项（view 中的位置） */
  var view = [];          /* 当前可见项在 ranked 中的索引（搜索过滤后） */
  var kw = "";            /* 搜索关键词（原始输入） */
  var panelUp = false;    /* 展开时锁定的展开方向：默认朝下，展开后不再随滚动翻转 */

  /* 弹窗尺寸：默认高度≈2 个门店条目（内容不足时按实际高度收缩）、上下安全边距 */
  var PANEL_MAX = 206, PANEL_MAX_NARROW = 190, PANEL_MIN = 108, PANEL_GAP = 6, PANEL_EDGE = 14;

  function modalOpen(msg, canRetry) {
    $("geoModalDesc").textContent = msg;
    $("geoRetry").hidden = !canRetry;
    geoModal.hidden = false;
    $("geoRetry").focus();
  }
  function modalClose() {
    geoModal.hidden = true;
    storeBtn.focus();
  }
  function live(msg) { storeLive.textContent = msg; }

  /* 未选择门店时：AI 求解按钮置灰 + 提示先选店 */
  function syncGen() {
    var btn = $("gen"), ok = !!selected;
    btn.disabled = !ok;
    btn.setAttribute("aria-disabled", ok ? "false" : "true");
    btn.title = ok ? "" : "请先选择就餐门店";
    $("genTip").textContent = ok
      ? "将跳转 AI 生成页并返回方案列表"
      : "请先选择就餐门店，再生成配餐方案";
  }

  function setBusy(b) {
    locating = b;
    storeRefresh.classList.toggle("busy", b);
    storeRefresh.disabled = b;
    storeRefresh.setAttribute("aria-busy", b ? "true" : "false");
    var t = storeRefresh.querySelector(".loc-text");
    if (t) t.textContent = b ? "定位中" : "定位";
  }

  /* 距离文案：GPS 距离优先；无定位时用接口快照参考值（≈ 前缀）；都没有则「距离未知」 */
  function distOf(s) {
    if (!s) return "";
    if (s.__dist != null) return MCD.distText(s.__dist);
    if (s.__snap != null) return "≈" + MCD.distText(s.__snap);
    return "";
  }

  /* ---------- 悬浮 Tooltip：仅在文字被截断时展示完整门店名 + 地址 ---------- */
  var tipEl = $("storeTip"), tipAnchor = null;

  function truncated(el) { return !!el && el.scrollWidth > el.clientWidth + 1; }
  function tipHTML(name, addr, extra) {
    return '<div class="st-tip-name">' + esc(name || "") + "</div>" +
      (addr ? '<div class="st-tip-addr">' + esc(addr) + "</div>" : "") +
      (extra ? '<div class="st-tip-extra">' + esc(extra) + "</div>" : "");
  }
  function tipShow(anchor) {
    if (!tipEl) return;
    tipEl.innerHTML = tipHTML(anchor.getAttribute("data-tip-name"),
      anchor.getAttribute("data-tip-addr"), anchor.getAttribute("data-tip-extra"));
    tipEl.hidden = false;
    tipEl.style.left = "0px"; tipEl.style.top = "0px";
    var r = anchor.getBoundingClientRect(), t = tipEl.getBoundingClientRect();
    var left = Math.min(Math.max(8, r.left), Math.max(8, window.innerWidth - t.width - 8));
    var top = r.bottom + 8;
    if (top + t.height > window.innerHeight - 8) top = Math.max(8, r.top - t.height - 8);
    tipEl.style.left = left + "px";
    tipEl.style.top = top + "px";
    tipAnchor = anchor;
  }
  function tipHide() {
    tipAnchor = null;
    if (tipEl) { tipEl.hidden = true; tipEl.innerHTML = ""; }
  }
  /* 名称或地址被省略时才弹提示，避免「麦…」这种过度截断 */
  function tipMaybe(el) {
    if (!el) return false;
    var probe = el.querySelector(".st-name") || el.querySelector(".si-main");
    var addr = el.querySelector(".st-addr");
    if (!truncated(probe) && !(addr && truncated(addr))) return false;
    tipShow(el);
    return true;
  }

  /* 距离过远（> DIST_MAX_M）时，在下拉面板顶部挂一条警示条；按钮下方的操作提示保持不变 */
  var FAR_KM = Math.round((MCD.DIST_MAX_M || 200000) / 1000);
  function anyFar() {
    return ranked.some(function (s) { return s.__far; });
  }

  /* ---------- 搜索过滤：门店名称 / 地址，按空格分词后全部命中才算匹配 ---------- */
  function flat(v) { return String(v || "").toLowerCase().replace(/[\s\u3000]+/g, ""); }
  function tokens(v) { return String(v || "").toLowerCase().split(/[\s\u3000]+/).filter(Boolean); }
  function hit(s, toks) {
    if (!toks.length) return true;
    var name = flat(s.storeName), addr = flat(s.address);
    return toks.every(function (t) {
      var q = flat(t);
      return !q || name.indexOf(q) >= 0 || addr.indexOf(q) >= 0;
    });
  }

  /* 渲染下拉列表：左 = 门店名称 + 地址（完整换行展示）｜右 = 距离 + 营业状态（由近到远） */
  function renderList() {
    tipHide();
    var toks = tokens(kw);
    view = [];
    ranked.forEach(function (s, i) { if (hit(s, toks)) view.push(i); });

    /* 计数条：无关键词显示总数，有关键词显示匹配数 */
    if (storeCount) {
      storeCount.innerHTML = toks.length
        ? "匹配 <b>" + view.length + "</b> / " + ranked.length + " 家门店"
        : "共 <b>" + ranked.length + "</b> 家门店";
    }
    if (storeClear) storeClear.hidden = !kw;

    if (!ranked.length) {
      storeList.innerHTML = '<li class="sl-empty">暂无门店数据</li>';
      return;
    }
    if (!view.length) {
      storeList.innerHTML = '<li class="sl-empty">没有匹配「' + esc(kw) + "」的门店，换个关键词试试</li>";
      return;
    }

    var warn = anyFar()
      ? '<li class="sl-warn" role="presentation"><span class="sl-warn-ico" aria-hidden="true">⚠</span>' +
        esc("定位距门店 >" + FAR_KM + "km，已按参考距离排序") + "</li>"
      : "";
    storeList.innerHTML = warn + view.map(function (idx) {
      var s = ranked[idx];
      var st = MCD.storeStatus(s);
      var name = s.storeName || "未命名门店";
      var addr = s.address || "";
      var d = distOf(s);
      var extra = st.text + (st.hours ? " · " + st.hours : "");
      return '<li class="store-opt" role="option" id="store-opt-' + idx + '" data-i="' + idx + '"' +
          ' aria-selected="' + (selected && selected.storeCode === s.storeCode ? "true" : "false") + '"' +
          ' data-tip-name="' + esc(name) + '" data-tip-addr="' + esc(addr) + '" data-tip-extra="' + esc(extra) + '"' +
          ' aria-label="' + esc(name + (addr ? "，" + addr : "") + "，" + extra +
            (d ? "，距离 " + d : "")) + '">' +
          '<span class="st-col">' +
            '<span class="st-name">' + esc(name) + "</span>" +
            '<span class="st-addr">' + esc(addr || "地址未提供") + "</span>" +
          "</span>" +
          '<span class="st-side">' +
            '<span class="st-dist' + (d ? (s.__dist != null ? "" : " snap") : " na") + '">' +
              esc(d || "距离未知") + "</span>" +
            '<span class="st-tag ' + (st.open ? "open" : "closed") + '">' + st.text + "</span>" +
          "</span>" +
        "</li>";
    }).join("");
  }

  function echo() {
    if (!selected) {
      storeValue.textContent = "请选择门店";
      storeValue.className = "si-main empty";
      storeMeta.textContent = "";
      storeBtn.removeAttribute("data-tip-name");
      storeBtn.removeAttribute("data-tip-addr");
      storeBtn.removeAttribute("data-tip-extra");
    } else {
      var st = MCD.storeStatus(selected);
      var name = selected.storeName || "未命名门店";
      /* 回显格式：门店名称 (营业中) · 182m */
      storeValue.textContent = name;
      storeValue.className = "si-main";
      var d = distOf(selected);
      storeMeta.textContent = "(" + (st.open ? "营业中" : "已打烊") + ")" + (d ? " · " + d : "");
      storeBtn.setAttribute("data-tip-name", name);
      storeBtn.setAttribute("data-tip-addr", selected.address || "");
      storeBtn.setAttribute("data-tip-extra", st.text + (st.hours ? " · " + st.hours : ""));
    }
    syncGen();
  }

  function selectStore(i, opts) {
    opts = opts || {};
    var s = ranked[i];
    if (!s) return;
    selected = s;
    if (!opts.keepPicked) picked = true;
    echo();
    renderList();
    /* 选中后把门店同步到求解状态（门店不参与营养求解，仅用于下单门店展示） */
    $("store").value = s.storeCode;
    if (!opts.silent) {
      live("已选择 " + (s.storeName || "") + "，" + (distOf(s) ? "距离 " + distOf(s) : "距离未知"));
    }
  }

  /* 弹窗定位：
     - 方向「默认朝下」且只在展开瞬间决定一次（下方连最小高度都放不下、上方明显更宽敞才朝上），
       展开后滚动 / 搜索都不再翻转，避免下拉“边滚边缩、方向乱跳”；
     - 高度 = min(期望高度, 该方向可用空间)，仅在展开 / 搜索 / 缩放时重算，页面滚动时锁定不变；
     - 下方可用空间同时受页脚顶约束，避免压住底部数据快照 / 调用方法说明。 */
  function placePanel(opts) {
    opts = opts || {};
    if (!storePanel || storePanel.hidden) return;
    var max = window.innerWidth <= 560 ? PANEL_MAX_NARROW : PANEL_MAX;
    /* overflow:hidden 下 scrollHeight 始终返回内容完整高度，无需清样式重排；
       （清 height 再量会瞬间放大列表，把 scrollTop 钳制回 0，导致“滚了又被弹回”） */
    var natural = storePanel.scrollHeight || max;        /* 搜索框 + 计数 + 全部条目 */
    var want = Math.min(max, natural);
    var r = (storeRow || storeBtn).getBoundingClientRect();
    /* 下方可用空间取「视口底」与「页脚顶」更近者（页脚顶 > 0 才参与约束：
       无布局环境返回 0，且页脚完全滚出顶部时无需额外限制） */
    var limitBelow = window.innerHeight;
    var foot = document.querySelector("footer.foot");
    if (foot) {
      var ft = foot.getBoundingClientRect().top;
      if (ft > 0) limitBelow = Math.min(limitBelow, ft);
    }
    var below = limitBelow - r.bottom - PANEL_GAP - PANEL_EDGE;
    var above = r.top - PANEL_GAP - PANEL_EDGE;
    /* 仅在展开瞬间定方向：默认朝下；下方放不下最小高度、且上方更宽敞时才朝上 */
    if (opts.reset) panelUp = below < Math.min(want, PANEL_MIN) && above > below;
    var avail = panelUp ? above : below;
    var h = Math.min(want, Math.max(avail, PANEL_MIN));
    storePanel.classList.toggle("up", panelUp);
    /* 显式 height + max-height 双写：flex 子项（门店列表）必须拿到确定高度，
       才会在合成器中被标记为可滚动；只写 max-height 时滚轮不滚动列表。
       值未变化时不重写样式，避免抖动打断合成器滚动状态 */
    if (storePanel.style.height !== Math.round(h) + "px") {
      storePanel.style.height = Math.round(h) + "px";
      storePanel.style.maxHeight = Math.round(h) + "px";
    }
  }

  function openList() {
    if (!ranked.length) return;
    kw = "";
    if (storeSearch) storeSearch.value = "";
    renderList();
    storePanel.hidden = false;
    storeList.scrollTop = 0;
    storeBtn.setAttribute("aria-expanded", "true");
    placePanel({ reset: true });   /* 展开瞬间定一次方向与高度，之后滚动不再改变 */
    /* 首次展开下拉才自动请求定位；之后只由「定位」按钮触发，避免反复弹权限。
       放在光标处理之前，避免后续渲染异常把定位请求挡掉。 */
    if (!myPos && !autoTried && !locating) doLocate({ auto: true });
    var sel = -1;
    if (selected) {
      sel = view.findIndex(function (idx) { return ranked[idx].storeCode === selected.storeCode; });
    }
    moveCursor(0, sel >= 0 ? sel : 0);
    /* preventScroll：避免聚焦搜索框时把页面滚走，导致刚算好的展开方向失效 */
    if (storeSearch) { try { storeSearch.focus({ preventScroll: true }); } catch (err) { storeSearch.focus(); } }
  }
  function closeList() {
    tipHide();
    if (storePanel) {
      storePanel.hidden = true;
      storePanel.classList.remove("up");
      storePanel.style.maxHeight = "";
      storePanel.style.height = "";
    }
    storeBtn.setAttribute("aria-expanded", "false");
    storeBtn.removeAttribute("aria-activedescendant");
    cursor = -1;
    /* 复位搜索词，下次打开是干净的全量列表 */
    kw = "";
    if (storeSearch) storeSearch.value = "";
    renderList();
  }
  /* step：相对移动；abs 传入时直接定位到该下标（用于打开时高亮已选门店） */
  function moveCursor(step, abs) {
    if (!storePanel || storePanel.hidden || !view.length) return;
    cursor = abs != null
      ? Math.max(0, Math.min(view.length - 1, abs))
      : (cursor + step + view.length) % view.length;
    var items = storeList.querySelectorAll(".store-opt");
    Array.prototype.forEach.call(items, function (el, i) {
      el.classList.toggle("cursor", i === cursor);
    });
    var cur = items[cursor];
    if (cur) {
      storeBtn.setAttribute("aria-activedescendant", cur.id);
      /* 只在列表内部滚动高亮项：scrollIntoView 会把整个页面一起滚走 */
      var lr = storeList.getBoundingClientRect(), er = cur.getBoundingClientRect();
      if (er.top < lr.top) storeList.scrollTop -= lr.top - er.top;
      else if (er.bottom > lr.bottom) storeList.scrollTop += er.bottom - lr.bottom;
    }
  }

  /* 计算 / 重算距离，并按需默认选中最近门店 */
  function refresh(opts) {
    opts = opts || {};
    ranked = MCD.rankStores(MCD.stores, myPos);
    if (selected) {
      var keep = ranked.filter(function (s) { return s.storeCode === selected.storeCode; })[0];
      selected = keep || null;
    }
    /* 有定位且用户未手动选择 → 默认选中距离最近的一家 */
    if (myPos && !picked && ranked.length && ranked[0].__dist != null) {
      selected = ranked[0];
      $("store").value = selected.storeCode;
      if (!opts.silent) {
        live("已定位，默认选择最近门店 " + selected.storeName + "，距离 " + distOf(selected));
      }
    }
    renderList();
    echo();
    if (storePanel && !storePanel.hidden) placePanel();
  }

  function doLocate(opts) {
    var auto = !!(opts && opts.auto);
    if (locating) return;
    autoTried = true;
    setBusy(true);
    storeHint.textContent = "正在获取当前位置…";
    live("正在获取当前位置");
    MCD.locate().then(function (p) {
      setBusy(false);
      myPos = p;
      refresh();
      var anyApprox = ranked.some(function (s) { return s.__geo && s.__geo.approx; });
      if (anyFar()) {
        /* 远距离警示改挂到下拉面板顶部，这里只留操作提示，并同步播报给读屏 */
        storeHint.textContent = "定位完成，可手动选择就近门店";
        live("定位距门店超过 " + FAR_KM + " 公里，距离已忽略，已按参考距离排序");
      } else {
        storeHint.innerHTML = "已按你的位置重新排序，由近到远 · 定位精度 " +
          (p.accuracy != null ? Math.round(p.accuracy) + "m" : "未知") +
          (anyApprox ? "；部分门店坐标按地址标注，距离为近似值" : "");
      }
    }).catch(function (err) {
      setBusy(false);
      myPos = null;
      refresh({ silent: true });
      storeHint.textContent = "定位获取失败，请手动选择门店";
      live("定位获取失败，请手动选择门店");
      /* 只有用户主动点「定位 / 重新定位」失败才弹窗；
         展开下拉时的自动定位失败不打断操作（弹窗会盖住下拉导致无法滚动选择） */
      if (!auto) {
        modalOpen(err && err.denied
          ? "请开启位置权限，获取附近门店"
          : "无法获取当前位置，请重试或手动选择门店", true);
      }
    });
  }

  storeBtn.addEventListener("click", function () {
    if (storePanel.hidden) openList(); else closeList();
  });
  /* 滚轮落在面板的非滚动区（搜索框 / 计数条 / 内边距）时转发给列表；
     列表区域交给原生合成器滚动（避免 handler 与原生双重滚动）；
     列表滚到头则交还给页面滚动，避免页面被“卡死” */
  storePanel.addEventListener("wheel", function (e) {
    if (!e.deltaY || storePanel.hidden) return;
    if (e.target && e.target.closest && e.target.closest("#storeList")) return;
    var canDown = storeList.scrollTop + storeList.clientHeight < storeList.scrollHeight - 1;
    var canUp = storeList.scrollTop > 0;
    if ((e.deltaY > 0 && canDown) || (e.deltaY < 0 && canUp)) {
      storeList.scrollTop += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });
  storeList.addEventListener("click", function (e) {
    var li = e.target.closest ? e.target.closest(".store-opt") : null;
    if (!li) return;
    selectStore(parseInt(li.getAttribute("data-i"), 10));
    closeList();
    storeBtn.focus();
  });
  storeBtn.addEventListener("keydown", function (e) {
    var k = e.key;
    if (k === "ArrowDown" || k === "ArrowUp") {
      e.preventDefault();
      if (storePanel.hidden) openList(); else moveCursor(k === "ArrowDown" ? 1 : -1);
    } else if (k === "Enter" || k === " " || k === "Spacebar") {
      e.preventDefault();
      if (storePanel.hidden) openList();
      else if (cursor >= 0 && view.length) { selectStore(view[cursor]); closeList(); }
    } else if (k === "Escape") {
      closeList();
    }
  });

  /* ---------- 弹窗内搜索：门店名称 / 地址模糊匹配 ---------- */
  if (storeSearch) {
    storeSearch.addEventListener("input", function () {
      kw = storeSearch.value;
      renderList();
      placePanel();
      if (view.length) moveCursor(0, 0);
      else storeBtn.removeAttribute("aria-activedescendant");
    });
    storeSearch.addEventListener("keydown", function (e) {
      var k = e.key;
      if (k === "ArrowDown" || k === "ArrowUp") {
        e.preventDefault(); moveCursor(k === "ArrowDown" ? 1 : -1);
      } else if (k === "Enter") {
        e.preventDefault();
        if (cursor >= 0 && view.length) {
          selectStore(view[cursor]); closeList(); storeBtn.focus();
        }
      } else if (k === "Escape") {
        e.preventDefault(); closeList(); storeBtn.focus();
      }
    });
  }
  if (storeClear) {
    storeClear.addEventListener("click", function () {
      kw = ""; storeSearch.value = ""; renderList(); placePanel();
      if (view.length) moveCursor(0, 0);
      storeSearch.focus();
    });
  }

  document.addEventListener("click", function (e) {
    if (storePanel.hidden) return;
    /* 弹窗里的按钮也算「内部点击」，否则点「手动选择门店」会被这里立刻关掉列表 */
    if (!e.target.closest) { closeList(); return; }
    if (!e.target.closest(".store-picker") && !e.target.closest("#geoModal")) closeList();
  });
  storeRefresh.addEventListener("click", doLocate);

  /* ---------- 名称/地址被省略时，悬浮或聚焦弹出完整信息 ---------- */
  document.addEventListener("mouseover", function (e) {
    if (!tipEl || !e.target.closest) return;
    var el = e.target.closest("[data-tip-name]");
    if (!el) return;
    if (tipAnchor === el && !tipEl.hidden) return;
    tipMaybe(el);
  });
  document.addEventListener("mouseout", function (e) {
    if (!tipAnchor) return;
    var to = e.relatedTarget;
    if (to && to.closest && to.closest("[data-tip-name]") === tipAnchor) return;
    tipHide();
  });
  document.addEventListener("focusin", function (e) {
    if (!tipEl || !e.target.closest) return;
    var el = e.target.closest("[data-tip-name]");
    if (el) tipMaybe(el);
  });
  document.addEventListener("focusout", tipHide);
  window.addEventListener("scroll", function () {
    if (tipAnchor) tipHide();
    /* 页面滚动时不再重算面板：面板随按钮一起移动，重算会导致高度被压、方向翻转 */
  }, true);
  window.addEventListener("resize", function () {
    tipHide();
    placePanel();
  });

  $("geoManual").addEventListener("click", function () { modalClose(); openList(); });
  $("geoRetry").addEventListener("click", function () { modalClose(); doLocate(); });
  geoModal.addEventListener("click", function (e) { if (e.target === geoModal) modalClose(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !geoModal.hidden) modalClose();
  });

  refresh({ silent: true });
  if (MCD.stores.length) {
    /* 初始化不请求定位、不弹窗：等用户点击门店下拉框或右侧「定位」按钮时再请求 */
    storeHint.textContent = "点击上方选择门店；点击右侧「定位」后按距离由近到远排序";
  } else {
    storeValue.textContent = "暂无门店数据";
    storeHint.textContent = "接口未返回门店数据";
  }

  /* ---------- 状态读取 ---------- */
  var kcalEl = $("kcal");

  function checkedValue(name, fallback) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : fallback;
  }
  function checkedValues(name) {
    return Array.prototype.map.call(
      document.querySelectorAll('input[name="' + name + '"]:checked'),
      function (el) { return el.value; }
    );
  }
  function state() {
    var kcal = parseInt(kcalEl.value, 10);
    return {
      kcal: isNaN(kcal) ? 700 : kcal,
      goal: checkedValue("goal", "balance"),
      avoid: checkedValues("avoid"),
      slot: $("slot").value,
      store: MCD.storeByCode($("store").value)
    };
  }

  /* ---------- 渲染 ---------- */
  var GOAL_TEXT = { cut: "减脂", bulk: "增肌", balance: "均衡" };
  var cur = null;

  function drawHero(st) {
    var ids = ["nodeKcal", "nodeProtein", "nodeFat", "nodeSodium"];
    if (!cur) {
      ids.forEach(function (id) { $(id).textContent = "无解"; });
      return;
    }
    $("nodeKcal").textContent = Math.round(cur.kcal) + " kcal";
    $("nodeProtein").textContent = "蛋白 " + MCD.num(cur.protein, 1) + " g";
    $("nodeFat").textContent = "脂肪 " + MCD.num(cur.fat, 1) + " g";
    $("nodeSodium").textContent = "钠 " + MCD.num(cur.sodium) + " mg";
  }

  function drawCharts(st) {
    var ringBox = $("kcalRing");
    var pct = cur ? Math.max(0, 1 - cur.dev / st.kcal) : 0;
    ringBox.innerHTML = MCD.ringSVG(pct, "达成度", cur ? String(Math.round(cur.kcal)) : "—", 168);
    ringBox.setAttribute("aria-label", cur
      ? "目标热量达成 " + Math.round(pct * 100) + "%，方案总热量 " + Math.round(cur.kcal) + " 千卡，误差 " + Math.round(cur.dev) + " 千卡"
      : "当前条件下暂无可行方案");

    var D = MCD.DAILY;
    var rows = cur ? [
      { label: "热量", value: cur.kcal, unit: "kcal", cap: D.energyKcal },
      { label: "蛋白", value: cur.protein, unit: "g", cap: D.protein },
      { label: "脂肪", value: cur.fat, unit: "g", cap: D.fat },
      { label: "碳水", value: cur.carb, unit: "g", cap: D.carbohydrate },
      { label: "钠", value: cur.sodium, unit: "mg", cap: D.sodium }
    ] : [];
    var radarBox = $("homeRadar");
    radarBox.innerHTML = MCD.radarSVG(rows, 280, { title: false, legend: false });
    radarBox.setAttribute("aria-label", rows.length
      ? "营养雷达，顶点为占每日推荐摄入量的百分比：" + rows.map(function (r) {
          return r.label + " " + MCD.num(r.value) + " " + r.unit + "，上限 " + r.cap + " " + r.unit +
            "，占 " + Math.round(r.value / r.cap * 100) + "%";
        }).join("；")
      : "暂无营养数据");
  }

  function drawPlan(st) {
    var tag = $("planTag");
    var box = $("homePlan");
    var entry = $("detailEntry");

    if (!cur) {
      tag.textContent = "无解";
      box.innerHTML = '<div class="empty">当前条件下没有符合 ±100kcal 误差的方案，请调整目标热量或忌口条件。</div>';
      entry.href = "detail.html";
      return;
    }

    tag.textContent = (GOAL_TEXT[st.goal] || "均衡") + " · 误差 " + Math.round(cur.dev) + " kcal";

    box.innerHTML =
      '<div class="picks">' + cur.items.map(function (i) {
        return '<div class="pick">' +
          (i.image ? '<img src="' + esc(i.image) + '" alt="' + esc(i.name) + '" loading="lazy">' : "") +
          '<div class="info"><b>' + esc(i.name) + '</b><small>' + MCD.num(i.nutrition.energyKcal) + " kcal · 蛋白 " +
          MCD.num(i.nutrition.protein, 1) + "g · 脂肪 " + MCD.num(i.nutrition.fat, 1) + "g" +
          (i.approx ? " · 营养来源：" + esc(i.nutritionVia) : "") + "</small></div>" +
          '<div class="price">' + MCD.yuan(i.price) + "</div></div>";
      }).join("") + "</div>" +
      '<div class="metrics mt-16">' +
        metric("总热量", Math.round(cur.kcal), "kcal", true) +
        metric("蛋白质", MCD.num(cur.protein, 1), "g", false) +
        metric("脂肪", MCD.num(cur.fat, 1), "g", false) +
        metric("碳水", MCD.num(cur.carb, 1), "g", false) +
        metric("钠", MCD.num(cur.sodium), "mg", false) +
        metric("参考总价", MCD.yuan(cur.price), "", true) +
      "</div>";

    if (cur.items[0]) entry.href = "detail.html?code=" + encodeURIComponent(cur.items[0].code);
  }

  function solve() {
    var st = state();
    var plans = MCD.generatePlans({ kcal: st.kcal, goal: st.goal, avoid: st.avoid, count: 3 });
    cur = plans[0] || null;
    drawHero(st);
    drawCharts(st);
    drawPlan(st);
  }

  /* 拖动滑块时每帧最多求解一次，避免组合遍历卡住主线程 */
  var frame = 0;
  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(function () { frame = 0; solve(); });
  }

  /* ---------- 事件绑定 ---------- */
  /* 门店不参与营养求解，只作为下单门店透传，无需重新算方案 */
  kcalEl.addEventListener("input", function () {
    var v = kcalEl.value;
    $("kcalLabel").textContent = v;
    kcalEl.setAttribute("aria-valuetext", v + " kcal");
    schedule();
  });
  $("slot").addEventListener("change", schedule);
  $("goalChips").addEventListener("change", schedule);
  $("avoidChips").addEventListener("change", schedule);

  $("gen").addEventListener("click", function () {
    var st = state();
    var btn = this;
    if (!st.store) {
      storeHint.textContent = "请先选择就餐门店（未定位时可手动选择）";
      live("请先选择就餐门店");
      openList();
      storeBtn.focus();
      return;
    }
    btn.disabled = true;
    location.href = "loading.html?" +
      "kcal=" + encodeURIComponent(st.kcal) +
      "&goal=" + encodeURIComponent(st.goal) +
      "&slot=" + encodeURIComponent(st.slot) +
      "&avoid=" + encodeURIComponent(st.avoid.join(",")) +
      "&store=" + encodeURIComponent((st.store && st.store.storeCode) || "");
  });

  kcalEl.setAttribute("aria-valuetext", kcalEl.value + " kcal");
  solve();
})();

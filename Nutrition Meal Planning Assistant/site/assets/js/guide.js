(function () {
  "use strict";

  if (!window.MCD) return;

  var $ = function (id) { return document.getElementById(id); };
  var esc = MCD.esc;

  MCD.mountNav("guide");
  MCD.mountFoot();

  $("nCount").textContent = MCD.nutrition.length;
  $("mCount").textContent = Object.keys(MCD.meals).length;
  $("sCount").textContent = MCD.stores.length;
  $("dCount").textContent = Object.keys(window.MCD_DETAILS || {}).length;

  var VER = [
    ["2026-08-27", "1.0.8", "新增积分抽奖工具：查看活动信息、抽奖、查我的奖品"],
    ["2026-07-29", "1.0.7", "新增麦当劳派对、品鉴会等主题活动查询、预约与下单功能"],
    ["2026-07-16", "1.0.6", "新增历史订单查询工具；支持展示餐品优惠价格；支持随单购买麦金卡和早餐卡"],
    ["2026-06-16", "1.0.5", "支持更换套餐内商品组合、部分餐品特制"],
    ["2026-05-21", "1.0.4", "新增积分兑换实物、商城订单查询等 Tools，支持得来速车道取餐场景下单及全部点餐场景预约功能"],
    ["2026-04-02", "1.0.3", "增加了到店取餐与团餐场景的 Tools"],
    ["2026-02-13", "1.0.2", "增加了麦乐送点餐与积分兑换券场景的 Tools"],
    ["2026-01-23", "1.0.1", "增加了「餐品营养信息列表」Tool，我们缩短了 URL 以便于大家连接"],
    ["2025-12-09", "1.0.0", "麦麦日历和麦麦省领券 MCP Server"]
  ];

  $("verBody").innerHTML = VER.map(function (v, i) {
    return "<tr>" + '<td class="mono">' + esc(v[0]) + "</td>" +
      '<td><span class="tag' + (i === 0 ? " gold" : "") + '">v' + esc(v[1]) + "</span></td>" +
      "<td>" + esc(v[2]) + "</td></tr>";
  }).join("");
})();

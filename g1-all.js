/* G1 All-in-One v2: gộp TẤT CẢ offer free + giảm giá cho iOS Shadowrocket.
 *
 * Nguồn SKU:
 *   - Module cũ (g1-ultra-1m-free): Ultra free 1 tháng
 *   - g1-acq v7.5: Pro 12 tháng -90%, 20TB/Ultra 3 tháng -90%/-75%
 *   - AI 2028 NEW (Android): Pro free 12/6/6/6 tháng, Ultra 20TB free 12 tháng
 *
 * Ưu tiên: FREE > giảm 90% > giảm 75%
 * Fallback: nếu target ưu tiên không có trong response, thử target tiếp theo
 */
"use strict";

(function () {
  var VERSION = "g1-all-v2";

  // ===== TẤT CẢ TARGET SKU ĐÃ BIẾT =====
  // Sorted by priority: FREE first, then biggest discount

  // --- FREE offers (eft = electronic funds transfer, $0) ---
  // Ultra 30TB
  var ULTRA_FREE_1M   = "g1.ai.ultra.1month_eft.acq";           // confirmed iOS
  var ULTRA_FREE_3M   = "g1.ai.ultra.3months_eft.acq";          // suy luận từ pattern
  var ULTRA_FREE_12M  = "g1.ai.ultra.12months_eft.acq";         // suy luận từ Android eft-12month

  // 20TB
  var T20_FREE_12M    = "g1.20tb.12months_eft.acq";             // suy luận từ Android eft-12month
  var T20_FREE_3M     = "g1.20tb.3months_eft.acq";              // suy luận từ pattern
  var T20_FREE_1M     = "g1.20tb.1month_eft.acq";               // suy luận từ pattern

  // Pro 2TB/5TB
  var PRO_FREE_12M    = "g1.2tb.ai.12months_eft.acq";           // suy luận từ Android 12months-eft
  var PRO_FREE_6M     = "g1.2tb.ai.6months_eft.acq";            // suy luận từ Android 6months-eft
  var PRO_FREE_1M     = "g1.2tb.ai.1month_eft.acq";             // suy luận từ pattern

  // --- DISCOUNT offers (ip = introductory price) ---
  // Ultra 30TB
  var ULTRA_90P_3M    = "g1.ai.ultra.3months_ip_90p.acq";       // confirmed iOS (g1-acq)
  var ULTRA_75P_3M    = "g1.ai.ultra.3months_ip_75p.acq";       // confirmed iOS (g1-acq)

  // 20TB
  var T20_90P_3M      = "g1.20tb.3months_ip_90p.acq";           // confirmed iOS (g1-acq)
  var T20_75P_3M      = "g1.20tb.3months_ip_75p.acq";           // confirmed iOS (g1-acq)

  // Pro 2TB/5TB
  var PRO_90P_12M     = "g1.2tb.ai.12months_ip_90p";            // confirmed iOS (g1-acq)
  var PRO_90P_3M      = "g1.2tb.ai.3months_ip_90p.acq";         // suy luận
  var PRO_90P_ANN     = "g1.2tb.ai.annual_ip_90p.acq";          // confirmed (g1-acq v7.3/v7.4)

  // ===== MAPPING CONFIG =====

  // Pro 2TB/5TB: source prefix → target chain
  var PRO_PREFIX = "g1.ios.2tb.";
  var PRO_CHAIN = [
    PRO_FREE_12M,     // $0 × 12 tháng
    PRO_FREE_6M,      // $0 × 6 tháng
    PRO_FREE_1M,      // $0 × 1 tháng
    PRO_90P_12M,      // -90% × 12 tháng ($1.99/tháng)
    PRO_90P_3M,       // -90% × 3 tháng
    PRO_90P_ANN       // -90% annual
  ];

  // 20TB & Ultra: source → target chain
  var SKU_CHAIN = {
    "g1.ios.30tb.ai.pro.m": [
      ULTRA_FREE_12M,  // $0 × 12 tháng
      ULTRA_FREE_3M,   // $0 × 3 tháng
      ULTRA_FREE_1M,   // $0 × 1 tháng  ← confirmed hoạt động
      ULTRA_90P_3M,    // -90% × 3 tháng
      ULTRA_75P_3M     // -75% × 3 tháng
    ],
    "g1.ios.20tb.m.v2": [
      T20_FREE_12M,    // $0 × 12 tháng
      T20_FREE_3M,     // $0 × 3 tháng
      T20_FREE_1M,     // $0 × 1 tháng
      T20_90P_3M,      // -90% × 3 tháng
      T20_75P_3M       // -75% × 3 tháng
    ]
  };

  // ===== XỬ LÝ =====

  var url = typeof $request === "object" && $request ? $request.url : "";

  if (typeof url !== "string" || !/^https:\/\/one\.google\.com\//.test(url)) {
    $done({});
    return;
  }

  var body = typeof $response === "object" && $response ? $response.body : undefined;

  if (typeof body !== "string") {
    $done({});
    return;
  }

  // Thu thập tất cả SKU có trong response gốc
  var observed = {};
  var skuPattern = /(?:^|[^A-Za-z0-9._@%-])(g1\.[A-Za-z0-9._-]+)(?=$|[^A-Za-z0-9._-])/g;
  var m;
  while ((m = skuPattern.exec(body)) !== null) {
    observed[m[1]] = true;
  }

  var mappings = {};
  var hits = 0;

  // Chọn target: ưu tiên target có trong response (xác nhận tồn tại), nếu không có thì dùng free nhất
  function pickTarget(chain) {
    // Pass 1: tìm target có trong response gốc, theo thứ tự ưu tiên
    for (var i = 0; i < chain.length; i++) {
      if (observed[chain[i]]) return { target: chain[i], method: "observed" };
    }
    // Pass 2: dùng target đầu tiên (free nhất) dù chưa thấy trong response
    return { target: chain[0], method: "preferred" };
  }

  var out = body.replace(
    /(^|[^A-Za-z0-9._@%-])(g1\.[A-Za-z0-9._-]+)(?=$|[^A-Za-z0-9._-])/g,
    function (match, before, id) {
      var pick = null;

      // Check 1: Pro 2TB prefix
      if (id.indexOf(PRO_PREFIX) === 0 && id.length > PRO_PREFIX.length) {
        pick = pickTarget(PRO_CHAIN);
      }
      // Check 2: 20TB / Ultra exact match
      else if (SKU_CHAIN[id]) {
        pick = pickTarget(SKU_CHAIN[id]);
      }

      if (!pick) return match;

      var to = pick.target;
      if (!mappings[id]) mappings[id] = { from: id, to: to, count: 0, method: pick.method };
      mappings[id].count++;
      hits++;
      return before + to;
    }
  );

  // Log
  console.log("[g1-all] " + VERSION + " hits=" + hits);
  var keys = Object.keys(mappings).sort();
  for (var i = 0; i < keys.length; i++) {
    var e = mappings[keys[i]];
    var tag = e.to.indexOf("_eft") !== -1 ? " [FREE]" :
              e.to.indexOf("_90p") !== -1 ? " [-90%]" :
              e.to.indexOf("_75p") !== -1 ? " [-75%]" : "";
    var src = e.method === "observed" ? " (confirmed)" : " (try)";
    console.log("[g1-all] " + e.from + " → " + e.to + " x" + e.count + tag + src);
  }

  $done(hits ? { body: out } : {});
})();

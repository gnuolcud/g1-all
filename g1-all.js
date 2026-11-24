/* DÒ SKU THẬT (vòng 3): lấy mã thật từ frida.js của injector, test trên iOS.
 * Mỗi nút gói gán 1 mã thật khác nhau. Nút nào hiện mua (FREE/giá) = mã đó sống trên iOS.
 * Mac: 192.168.2.8:8787 + 100.107.231.43:8787 */
"use strict";

(function () {
  var COLLECTORS = ["http://192.168.2.8:8787/skus", "http://100.107.231.43:8787/skus"];

  // nút (source) -> mã thật thử (target) — mã lấy từ catalog, không đoán
  var MAP = {
    "g1.ios.30tb.ai.pro.m": "g1.2tb.6months_eft",             // ⭐ FREE 6 tháng Plus 2TB (dạng SKU độc lập)
    "g1.ios.20tb.m.v2":     "g1.ai.ultra.1month_ip_90p.acq",  // Ultra 30TB 1 tháng -90%
    "g1.ios.2tb.ai.m":      "g1.10tb.1month_ip_90p",          // Pro 10TB 1 tháng -90% (tier mới)
    "g1.ios.2tb.ai.a":      "g1.ai.ultra.3months_ip_80p.acq", // Ultra 3 tháng -80%
    "g1.ios.2tb.m":         "g1.2tb.ai.3months_ip_75p.acq",   // Pro 5TB 3 tháng -75%
    "g1.ios.2tb.a":         "g1.2tb.3months_ip_85p.acq",      // Plus 2TB 3 tháng -85%
    "g1.ios.100gb.m":       "g1.helium.3months_ip_75p.acq",   // Helium 400GB -75%
    "g1.ios.helium.m":      "g1.ai.ultra.1month_eft.acq"      // CHỐT: Ultra 1 tháng free (đã sống)
  };

  var url = (typeof $request === "object" && $request) ? $request.url : "";
  var body = (typeof $response === "object" && $response) ? $response.body : undefined;

  if (typeof url !== "string" || !/^https:\/\/one\.google\.com\//.test(url) ||
      typeof body !== "string") {
    $done({});
    return;
  }

  var fired = [];
  var out = body.replace(
    /(^|[^A-Za-z0-9._@%-])(g1\.[A-Za-z0-9._-]+)(?=$|[^A-Za-z0-9._-])/g,
    function (match, before, id) {
      if (Object.prototype.hasOwnProperty.call(MAP, id)) {
        fired.push(id + " -> " + MAP[id]);
        return before + MAP[id];
      }
      return match;
    }
  );

  if (fired.length && typeof $httpClient !== "undefined" && $httpClient.post) {
    var payload = JSON.stringify({ hb: "REWRITE", fired: fired });
    for (var i = 0; i < COLLECTORS.length; i++) {
      $httpClient.post({ url: COLLECTORS[i], headers: { "Content-Type": "application/json" }, body: payload }, function () {});
    }
    console.log("[g1-probe3] rewrote " + fired.length);
  }

  $done(fired.length ? { body: out } : {});
})();

/* DÒ FREE vòng 2: free 1 tháng tier khác + cơ chế _ip_100p (giảm 100% = free).
 * Nút nào hiện mua FREE = mã đó sống.
 * Mac: 192.168.2.8:8787 + 100.107.231.43:8787 */
"use strict";

(function () {
  var COLLECTORS = ["http://192.168.2.8:8787/skus", "http://100.107.231.43:8787/skus"];

  // nút (source) -> mã thử (target)
  var MAP = {
    "g1.ios.30tb.ai.pro.m": "g1.ai.ultra.1month_eft.acq",        // CHỐT: Ultra free 1 tháng (đã sống)
    "g1.ios.20tb.m.v2":     "g1.20tb.1month_eft.acq",            // 20TB free 1 tháng?
    "g1.ios.2tb.ai.m":      "g1.2tb.ai.1month_eft.acq",          // Pro free 1 tháng?
    "g1.ios.2tb.ai.a":      "g1.ai.ultra.12months_ip_100p.acq",  // Ultra 12 tháng free qua giảm-100%?
    "g1.ios.2tb.m":         "g1.ai.ultra.1month_ip_100p.acq",    // Ultra 1 tháng qua giảm-100%?
    "g1.ios.2tb.a":         "g1.2tb.ai.12months_ip_100p",        // Pro 12 tháng free qua giảm-100%?
    "g1.ios.100gb.m":       "g1.20tb.12months_ip_100p.acq",      // 20TB 12 tháng free qua giảm-100%?
    "g1.ios.helium.m":      "g1.helium.1month_eft.acq"           // helium free 1 tháng?
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
    console.log("[g1-probe2] rewrote " + fired.length);
  }

  $done(fired.length ? { body: out } : {});
})();

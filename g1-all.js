/* DÒ FREE: mỗi nút gói gán 1 mã _eft khác nhau để tìm free ẩn.
 * Nút nào hiện màn hình mua FREE = mã đó sống.
 * Vẫn gửi telemetry về Mac để biết nút nào đã rewrite.
 * Mac: 192.168.2.8:8787 (WiFi) */
"use strict";

(function () {
  var COLLECTOR = "http://192.168.2.8:8787/skus";

  // BẢNG DÒ: nút (source) -> mã free thử (target)
  var MAP = {
    "g1.ios.30tb.ai.pro.m": "g1.ai.ultra.3months_eft.acq",  // Ultra -> free 3 tháng
    "g1.ios.20tb.m.v2":     "g1.ai.ultra.6months_eft.acq",  // 20TB  -> Ultra free 6 tháng
    "g1.ios.2tb.ai.m":      "g1.ai.ultra.2months_eft.acq",  // Pro(th)-> Ultra free 2 tháng
    "g1.ios.2tb.ai.a":      "g1.2tb.ai.12months_eft.acq",   // Pro(năm)-> Pro free 12 tháng
    "g1.ios.2tb.m":         "g1.2tb.ai.6months_eft.acq",    // 2TB   -> Pro free 6 tháng
    "g1.ios.2tb.a":         "g1.2tb.ai.3months_eft.acq",    // 2TB(năm)-> Pro free 3 tháng
    "g1.ios.100gb.m":       "g1.20tb.3months_eft.acq",      // 100GB -> 20TB free 3 tháng
    "g1.ios.helium.m":      "g1.ai.ultra.1month_eft.acq"    // helium-> CHỐT: 1 tháng free (đã biết sống)
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
    $httpClient.post(
      { url: COLLECTOR, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hb: "REWRITE", fired: fired }) },
      function () {}
    );
    console.log("[g1-probe] rewrote " + fired.length);
  }

  $done(fired.length ? { body: out } : {});
})();

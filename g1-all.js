/* PROBE v3 + telemetry chắc chắn: rewrite mã thật, BẮN LOG mọi response.
 * Lưu ý: server chỉ biết đã rewrite gì + SKU Google trả về.
 * FREE/giá/lỗi do Apple StoreKit quyết -> chỉ thấy trên màn hình iPhone.
 * Mac: 192.168.2.8:8787 + 100.107.231.43:8787 */
"use strict";

(function () {
  var COLLECTORS = ["http://192.168.2.8:8787/skus", "http://100.107.231.43:8787/skus"];

  var MAP = {
    "g1.ios.helium.m":      "g1.ai.ultra.1month_eft.acq"
  };

  var url = (typeof $request === "object" && $request) ? $request.url : "";
  if (typeof url !== "string" || !/^https:\/\/one\.google\.com\//.test(url)) { $done({}); return; }

  var body = (typeof $response === "object" && $response) ? $response.body : undefined;
  var hasBody = typeof body === "string";
  var path = url.replace(/^https:\/\/one\.google\.com/, "").split(/[?#]/)[0] || "/";

  // SKU Google trả về trong response (sau khi bấm có thể có mã mới)
  var seen = {};
  if (hasBody) {
    var t = body.replace(/\\u002e|\\x2e/gi, ".");
    var sr = /(?:^|[^A-Za-z0-9._@%-])(g1\.[A-Za-z0-9._-]+)(?=$|[^A-Za-z0-9._-])/g;
    var s;
    while ((s = sr.exec(t)) !== null) seen[s[1]] = true;
  }

  var fired = [];
  var out = body;
  if (hasBody) {
    out = body.replace(
      /(^|[^A-Za-z0-9._@%-])(g1\.[A-Za-z0-9._-]+)(?=$|[^A-Za-z0-9._-])/g,
      function (match, before, id) {
        if (Object.prototype.hasOwnProperty.call(MAP, id)) {
          fired.push(id + " -> " + MAP[id]);
          return before + MAP[id];
        }
        return match;
      }
    );
  }

  // BẮN LOG mọi response (kể cả không rewrite) để biết chắc module chạy
  if (typeof $httpClient !== "undefined" && $httpClient.post) {
    var payload = JSON.stringify({ hb: "PROBE3", path: path, fired: fired, seen: Object.keys(seen) });
    for (var i = 0; i < COLLECTORS.length; i++) {
      $httpClient.post({ url: COLLECTORS[i], headers: { "Content-Type": "application/json" }, body: payload }, function () {});
    }
  }

  $done(fired.length ? { body: out } : {});
})();

/* CHẾ ĐỘ SCAN + HEARTBEAT: mỗi response one.google.com đều ping về Mac,
 * kèm SKU thật nếu có. Không đổi response.
 * Mac: 192.168.2.8 (WiFi) + 100.107.231.43 (Tailscale) :8787 */
"use strict";

(function () {
  var COLLECTORS = [
    "http://192.168.2.8:8787/skus",
    "http://100.107.231.43:8787/skus"
  ];
  var url = (typeof $request === "object" && $request) ? $request.url : "";
  var body = (typeof $response === "object" && $response) ? $response.body : "";

  if (typeof url !== "string" || !/^https:\/\/one\.google\.com\//.test(url)) {
    $done({});
    return;
  }

  var path = url.replace(/^https:\/\/one\.google\.com/, "").split(/[?#]/)[0] || "/";
  var hasBody = typeof body === "string";
  var text = hasBody ? body.replace(/\\u002e|\\x2e|&#0*46;|&#x0*2e;|&period;/gi, ".") : "";
  var re = /(?:^|[^A-Za-z0-9._@%-])(g1\.[A-Za-z0-9._-]+)(?=$|[^A-Za-z0-9._-])/g;
  var found = {};
  var m;
  while ((m = re.exec(text)) !== null) found[m[1]] = true;
  var list = Object.keys(found);

  // Luôn gửi heartbeat: {hb: path, body: có/không, skus: [...]}
  var payload = JSON.stringify({ hb: path, body: hasBody, skus: list });
  if (typeof $httpClient !== "undefined" && $httpClient.post) {
    for (var i = 0; i < COLLECTORS.length; i++) {
      $httpClient.post(
        { url: COLLECTORS[i], headers: { "Content-Type": "application/json" }, body: payload },
        function () {}
      );
    }
    console.log("[g1-scan] hb " + path + " body=" + hasBody + " skus=" + list.length);
  }

  $done({});
})();

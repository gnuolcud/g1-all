/* CHẾ ĐỘ SCAN: thu SKU thật từ one.google.com, gửi về Mac qua WiFi/Tailscale.
 * Không đổi response. Mac: 192.168.2.8 (WiFi) + 100.107.231.43 (Tailscale) :8787 */
"use strict";

(function () {
  var COLLECTORS = [
    "http://192.168.2.8:8787/skus",
    "http://100.107.231.43:8787/skus"
  ];
  var url = (typeof $request === "object" && $request) ? $request.url : "";
  var body = (typeof $response === "object" && $response) ? $response.body : undefined;

  if (typeof url !== "string" || !/^https:\/\/one\.google\.com\//.test(url) ||
      typeof body !== "string") {
    $done({});
    return;
  }

  var text = body.replace(/\\u002e|\\x2e|&#0*46;|&#x0*2e;|&period;/gi, ".");
  var re = /(?:^|[^A-Za-z0-9._@%-])(g1\.[A-Za-z0-9._-]+)(?=$|[^A-Za-z0-9._-])/g;
  var found = {};
  var m;
  while ((m = re.exec(text)) !== null) found[m[1]] = true;

  var list = Object.keys(found);
  if (list.length && typeof $httpClient !== "undefined" && $httpClient.post) {
    var payload = JSON.stringify(list);
    for (var i = 0; i < COLLECTORS.length; i++) {
      $httpClient.post(
        { url: COLLECTORS[i], headers: { "Content-Type": "application/json" }, body: payload },
        function () {}
      );
    }
    console.log("[g1-scan] gửi " + list.length + " SKU về Mac");
  }

  $done({});
})();

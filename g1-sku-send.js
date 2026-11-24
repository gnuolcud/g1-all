/* Thu SKU thật từ response one.google.com rồi gửi về Mac qua Tailscale.
 * Không đổi response (passive). Mac: http://100.107.231.43:8787 */
"use strict";

(function () {
  var COLLECTOR = "http://100.107.231.43:8787/skus";
  var url = (typeof $request === "object" && $request) ? $request.url : "";
  var body = (typeof $response === "object" && $response) ? $response.body : undefined;

  if (typeof url !== "string" || !/^https:\/\/one\.google\.com\//.test(url) ||
      typeof body !== "string") {
    $done({});
    return;
  }

  // decode escaped dots để bắt SKU bị escape
  var text = body.replace(/\\u002e|\\x2e|&#0*46;|&#x0*2e;|&period;/gi, ".");
  var re = /(?:^|[^A-Za-z0-9._@%-])(g1\.[A-Za-z0-9._-]+)(?=$|[^A-Za-z0-9._-])/g;
  var found = {};
  var m;
  while ((m = re.exec(text)) !== null) found[m[1]] = true;

  var list = Object.keys(found);
  if (list.length && typeof $httpClient !== "undefined" && $httpClient.post) {
    $httpClient.post(
      { url: COLLECTOR, headers: { "Content-Type": "application/json" }, body: JSON.stringify(list) },
      function () {}
    );
    console.log("[g1-send] gửi " + list.length + " SKU về Mac");
  }

  $done({});
})();

/* DÒ APPLE STOREKIT: bắt câu trả lời của Apple khi app hỏi gói Google One.
 * Nếu Apple không ghim cert -> thấy list mã thật + offer free/giảm giá.
 * Gửi về Mac: 192.168.2.8:8787 */
"use strict";

(function () {
  var COLLECTORS = ["http://192.168.2.8:8787/skus", "http://100.107.231.43:8787/skus"];
  var url = (typeof $request === "object" && $request) ? $request.url : "";
  var body = (typeof $response === "object" && $response) ? $response.body : "";

  if (typeof url !== "string") { $done({}); return; }

  var text = typeof body === "string" ? body : "";
  // Mọi dạng product-id của Google One trên App Store + dấu hiệu offer
  var idRe = /(?:g1\.|com\.google\.one\.|com\.google\.android\.apps\.subscriptions)[A-Za-z0-9._-]{2,80}/g;
  var ids = {};
  var m;
  while ((m = idRe.exec(text)) !== null) ids[m[0]] = true;

  // dấu hiệu free / intro offer
  var offerRe = /(introductoryPrice|freeTrial|introOffer|promotional|_eft|_ip_\d+p|P\d+[DWMY]|"0"|free)/gi;
  var offers = {};
  var o;
  while ((o = offerRe.exec(text)) !== null) { offers[o[0]] = (offers[o[0]] || 0) + 1; if (Object.keys(offers).length > 30) break; }

  var idList = Object.keys(ids);
  var path = url.split(/[?#]/)[0];

  if (idList.length && typeof $httpClient !== "undefined" && $httpClient.post) {
    var payload = JSON.stringify({ hb: "APPLE", path: path, ids: idList, offers: Object.keys(offers), sample: text.slice(0, 400) });
    for (var i = 0; i < COLLECTORS.length; i++) {
      $httpClient.post({ url: COLLECTORS[i], headers: { "Content-Type": "application/json" }, body: payload }, function () {});
    }
    console.log("[g1-apple] " + idList.length + " ids @ " + path);
  }

  $done({});
})();

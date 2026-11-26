/* Local-only report & interactive SKU switcher served by a Shadowrocket http-request script.
 *
 * Attribution & Credits:
 *   - Based on `crhywun/g1-acq` (https://github.com/crhywun/g1-acq) by @crhywun
 *   - Extended in v8.0.0 with interactive 1-tap Safari target SKU switching & newly discovered 18M/15M/12M/6M/1Y free trial SKUs.
 */
"use strict";

(function () {
  var ROOT = "https://one.google.com/g1-sku-report";
  var VERSION = "v8.1-ios";
  var COLLECTOR_VERSION = "g1-acq-v8.1-ios";
  var DEFAULT_TARGET = "com.google.gemini.2tb.ai.m.3month_ip_99p";
  var TARGET_OVERRIDE_KEY = "g1.target.override.v2";
  var LEGACY_TARGET = "g1.2tb.ai.annual";
  var SCAN_KEY = "g1.sku.scan.v1";
  var TEST_KEY = "g1.pro.annual.test.v1";

  var PRESET_SKUS = [
    { sku: "com.google.gemini.2tb.ai.m.3month_ip_99p", label: "★★ Pro 5TB · Gemini 3T 99% off (~7k VND/T) [iOS OK]", tag: "7K PRO" },
    { sku: "g1.ios.20tb.m", label: "★ Ultra 20TB · SKU Thổ Nhĩ Kỳ [iOS OK]", tag: "ULTRA 20T" },
    { sku: "g1.ios.30tb.m", label: "★ Ultra 30TB · SKU Thổ Nhĩ Kỳ [iOS OK]", tag: "ULTRA 30T" },
    { sku: "g1.2tb.ai.12months_ip_90p", label: "Pro 5TB · Giảm 90% 12T ($1.99/T) [Android]", tag: "$1.99×12T" },
    { sku: "g1.2tb.ai.3months_ip_90p.acq", label: "Pro 5TB · Giảm 90% 3T ($1.99/T) [Android]", tag: "$1.99×3T" },
    { sku: "g1.2tb.ai.1month_ip_95p.acq", label: "Pro 5TB · Giảm 95% tháng đầu ($0.99) [Android]", tag: "$0.99×1T" },
    { sku: "g1.2tb.ai.18months_eft", label: "Pro 5TB · Miễn phí 18T [Android only]", tag: "FREE 18T" },
    { sku: "g1.2tb.ai.12months_eft", label: "Pro 5TB · Miễn phí 12T [Android only]", tag: "FREE 12T" },
    { sku: "g1.20tb.3months_ip_75p.acq", label: "Ultra 20TB · Giảm 75% 3T ($24.99/T) [Android]", tag: "$25×3T" },
    { sku: "g1.ai.ultra.3months_ip_75p.acq", label: "Ultra 30TB · Giảm 75% 3T ($49.99/T) [Android]", tag: "$50×3T" },
    { sku: "g1.2tb.1year_eft", label: "AI Plus 2TB · Miễn phí 12T [Android only]", tag: "FREE 12T" },
    { sku: "g1.play.helium", label: "AI Plus 400GB · Miễn phí 12T [Android only]", tag: "FREE 12T" },
    { sku: "g1.100gb.1year_eft", label: "100GB · Miễn phí 12T [Android only]", tag: "FREE 12T" }
  ];

  var url = typeof $request === "object" && $request ? $request.url : "";
  if (typeof url !== "string" || !/^https:\/\/one\.google\.com\/g1-sku-report\/?(?:\?|$)/.test(url)) {
    $done({});
    return;
  }

  var storageAvailable = typeof $persistentStore !== "undefined" &&
    typeof $persistentStore.read === "function";
  var clearMessage = "";

  var ULTRA_20TB_KEY = "g1.target.override.20tb";
  var ULTRA_30TB_KEY = "g1.target.override.30tb";
  var validSku = /^(?:g1\.|com\.google\.)[A-Za-z0-9._-]{2,120}$/;

  // Handle interactive target switching via ?set_target=<sku> or ?set_20tb=<sku> or ?set_30tb=<sku>
  var targetMatch = /(?:\?|&)set_target=([A-Za-z0-9._%-]+)(?:&|$)/.exec(url);
  var ultra20Match = /(?:\?|&)set_20tb=([A-Za-z0-9._%-]+)(?:&|$)/.exec(url);
  var ultra30Match = /(?:\?|&)set_30tb=([A-Za-z0-9._%-]+)(?:&|$)/.exec(url);
  if (targetMatch && storageAvailable) {
    var newTarget = decodeURIComponent(targetMatch[1]);
    if (validSku.test(newTarget)) {
      try {
        var okWrite = $persistentStore.write(newTarget, TARGET_OVERRIDE_KEY);
        clearMessage = okWrite ? ("✅ Đã chuyển Pro 2TB/5TB → " + newTarget + " — Quay lại Google app để test.") : "Lỗi ghi.";
      } catch (e) { clearMessage = "Lỗi storage."; }
    }
  }
  if (ultra20Match && storageAvailable) {
    var new20 = decodeURIComponent(ultra20Match[1]);
    if (validSku.test(new20)) {
      try {
        var ok20 = $persistentStore.write(new20, ULTRA_20TB_KEY);
        clearMessage = ok20 ? ("✅ Đã chuyển Ultra 20TB → " + new20 + " — Quay lại Google app để test.") : "Lỗi ghi.";
      } catch (e) { clearMessage = "Lỗi storage."; }
    }
  }
  if (ultra30Match && storageAvailable) {
    var new30 = decodeURIComponent(ultra30Match[1]);
    if (validSku.test(new30)) {
      try {
        var ok30 = $persistentStore.write(new30, ULTRA_30TB_KEY);
        clearMessage = ok30 ? ("✅ Đã chuyển Ultra 30TB → " + new30 + " — Quay lại Google app để test.") : "Lỗi ghi.";
      } catch (e) { clearMessage = "Lỗi storage."; }
    }
  }

  if (/(?:\?|&)clear=1(?:&|$)/.test(url)) {
    try {
      var scanCleared = $persistentStore.write("{}", SCAN_KEY);
      var testCleared = $persistentStore.write("{}", TEST_KEY);
      clearMessage = scanCleared && testCleared ? "Đã xoá dữ liệu thu thập." : "Xoá chưa hoàn tất.";
    } catch (error) { clearMessage = "Lỗi storage."; }
  }

  var CONFIGURED_TARGET = DEFAULT_TARGET;
  var CONFIGURED_20TB = "g1.ios.20tb.m";
  var CONFIGURED_30TB = "g1.ios.30tb.m";
  if (storageAvailable) {
    try {
      var custom = ($persistentStore.read(TARGET_OVERRIDE_KEY) || "").trim();
      if (validSku.test(custom)) CONFIGURED_TARGET = custom;
      var c20 = ($persistentStore.read(ULTRA_20TB_KEY) || "").trim();
      if (validSku.test(c20)) CONFIGURED_20TB = c20;
      var c30 = ($persistentStore.read(ULTRA_30TB_KEY) || "").trim();
      if (validSku.test(c30)) CONFIGURED_30TB = c30;
    } catch (e) {}
  }

  function load(key) {
    if (!storageAvailable) return {};
    try {
      var value = JSON.parse($persistentStore.read(key) || "{}");
      return value && value.schemaVersion === 1 ? value : {};
    } catch (error) {
      return {};
    }
  }
  function text(value, length) {
    return typeof value === "string" ? value.slice(0, length || 180) : "";
  }
  function count(value) {
    var number = Number(value);
    return isFinite(number) && number > 0 ? Math.floor(number) : 0;
  }
  function sku(value) {
    return typeof value === "string" && /^g1\.[A-Za-z0-9._-]{1,160}$/.test(value) ? value : "";
  }
  function rows(value, withTime, defaultTarget) {
    if (!Array.isArray(value)) return [];
    return value.slice(0, 300).filter(function (row) {
      return row && typeof row.id === "string" &&
        /^(?:g1\.|com\.google\.one\.)[A-Za-z0-9._-]{1,160}$/.test(row.id);
    }).map(function (row) {
      var out = { id: row.id, count: count(row.count) };
      if (withTime) {
        out.lastSeen = text(row.lastSeen, 32);
      } else {
        out.to = sku(row.to) || (row.id.indexOf("g1.ios.2tb.") === 0 ? defaultTarget || "" : "");
        out.fallback = row.fallback === true;
      }
      return out;
    }).sort(function (a, b) { return a.id < b.id ? -1 : a.id > b.id ? 1 : 0; });
  }

  var scanStatuses = {
    "new-skus": "Tìm thấy SKU mới",
    "known-skus": "SKU đã có trong danh sách",
    "no-skus": "Không có SKU trong response",
    "limit-reached": "Đạt giới hạn thu thập",
    "non-text": "Response không phải text"
  };
  var scanPaths = ["/", "/ai", "/plans", "/_/…/data/batchexecute", "[đường dẫn khác]"];
  function recent(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(-10).filter(function (event) {
      return event && typeof event.at === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(event.at) &&
        (event.bodyType === "text" || event.bodyType === "non-text") &&
        Object.prototype.hasOwnProperty.call(scanStatuses, event.status);
    }).map(function (event) {
      return {
        at: event.at,
        path: scanPaths.indexOf(event.path) !== -1 ? event.path : "[đường dẫn khác]",
        bodyType: event.bodyType,
        status: event.status,
        candidateCount: count(event.candidateCount),
        addedCount: count(event.addedCount),
        omittedCount: count(event.omittedCount)
      };
    });
  }

  var scanRaw = load(SCAN_KEY);
  var testRaw = load(TEST_KEY);
  var recordedTarget = sku(testRaw.target);
  if (!recordedTarget && /^(?:pro-annual-test-v[12]|g1-acq-v7(?:\.0|\.1)?)$/.test(testRaw.version || "")) {
    recordedTarget = LEGACY_TARGET;
  }
  var matchedFrom = rows(testRaw.matchedFrom, false, recordedTarget);
  if (!recordedTarget) {
    matchedFrom.some(function (row) {
      if (row.id.indexOf("g1.ios.2tb.") === 0 && row.to) {
        recordedTarget = row.to;
        return true;
      }
      return false;
    });
  }
  var annualHitCount = typeof testRaw.annualHitCount === "number" ? count(testRaw.annualHitCount) :
    matchedFrom.reduce(function (total, row) {
      return total + (row.id.indexOf("g1.ios.2tb.") === 0 ? row.count : 0);
    }, 0);
  var storedOrigin = text(testRaw.targetOrigin, 32);
  var targetOrigin = recordedTarget && /^(?:user-specified|pattern-derived|legacy)$/.test(storedOrigin) ?
    storedOrigin : recordedTarget === CONFIGURED_TARGET ? "user-specified" :
      recordedTarget === LEGACY_TARGET ? "legacy" : "";
  var report = {
    schemaVersion: 1,
    reportVersion: VERSION,
    configuredTarget: CONFIGURED_TARGET,
    storageAvailable: storageAvailable,
    scan: {
      version: text(scanRaw.version, 32),
      updatedAt: text(scanRaw.updatedAt, 32),
      scannedResponses: count(scanRaw.scannedResponses),
      matchedResponses: count(scanRaw.matchedResponses),
      nonTextResponses: count(scanRaw.nonTextResponses),
      recentResponses: recent(scanRaw.recentResponses),
      truncated: scanRaw.truncated === true,
      limit: 300,
      skus: rows(scanRaw.skus, true)
    },
    test: {
      version: text(testRaw.version, 32),
      updatedAt: text(testRaw.updatedAt, 32),
      sourcePrefix: "g1.ios.2tb.",
      target: recordedTarget,
      targetOrigin: targetOrigin,
      status: text(testRaw.status, 32),
      hitCount: count(testRaw.hitCount),
      annualHitCount: annualHitCount,
      matchedFrom: matchedFrom
    }
  };

  var headers = {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-G1-Report-Version": VERSION,
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"
  };
  var exportJSON = /(?:\?|&)format=json(?:&|$)/.test(url);
  if (exportJSON) {
    headers["Content-Type"] = "application/json; charset=utf-8";
    headers["Content-Disposition"] = 'attachment; filename="g1-sku-report.json"';
    $done({ response: { status: 200, headers: headers, body: JSON.stringify(report, null, 2) } });
    return;
  }

  function escape(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
    });
  }
  function fallbackName(row) {
    if (!row.fallback) return "Không";
    var discount = /_ip_(\d+p)\.acq$/.exec(row.to || "");
    return discount ? discount[1] : "Có";
  }
  function table(items, withTime) {
    if (!items.length) return "<p>Chưa có dữ liệu.</p>";
    return "<div class=scroll><table><thead><tr><th>Mã SKU</th><th>Số lần</th>" +
      (withTime ? "<th>Lần cuối (UTC)</th>" : "<th>SKU mục tiêu</th><th>Dự phòng</th>") + "</tr></thead><tbody>" +
      items.map(function (row) {
        return "<tr><td><code>" + escape(row.id) + "</code></td><td>" + row.count + "</td>" +
          (withTime ? "<td>" + escape(row.lastSeen) + "</td>" :
            "<td><code>" + escape(row.to || "Chưa ghi") + "</code></td><td>" + fallbackName(row) + "</td>") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }
  function recentTable(events) {
    if (!events.length) return "<p>Chưa có lịch sử response.</p>";
    return "<div class=scroll><table><thead><tr><th>Thời gian (UTC)</th><th>Đường dẫn</th><th>Kết quả</th><th>SKU tìm thấy</th><th>Mới thêm</th><th>Vượt giới hạn</th></tr></thead><tbody>" +
      events.slice().reverse().map(function (event) {
        return "<tr><td>" + escape(event.at) + "</td><td>" + escape(event.path) +
          "</td><td>" + scanStatuses[event.status] + "</td><td>" + event.candidateCount +
          "</td><td>" + event.addedCount + "</td><td>" + event.omittedCount + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }
  var ULTRA_TEST_SKUS = [
    { sku: "g1.ios.20tb.m", label: "Ultra 20TB · SKU Thổ [iOS OK, giá gốc]", tag: "THỔ 20T", plan: "20tb" },
    { sku: "g1.ios.30tb.m", label: "Ultra 30TB · SKU Thổ [iOS OK, giá gốc]", tag: "THỔ 30T", plan: "30tb" },
    { sku: "com.google.gemini.20tb.m.3month_ip_99p", label: "Test: Gemini 20TB 99% off", tag: "TEST", plan: "20tb" },
    { sku: "com.google.gemini.20tb.ai.m.3month_ip_99p", label: "Test: Gemini AI 20TB 99% off", tag: "TEST", plan: "20tb" },
    { sku: "com.google.one.20tb.m.3month_ip_99p", label: "Test: Google One 20TB 99% off", tag: "TEST", plan: "20tb" },
    { sku: "com.google.gemini.30tb.ai.m.3month_ip_99p", label: "Test: Gemini 30TB 99% off", tag: "TEST", plan: "30tb" },
    { sku: "com.google.gemini.ultra.m.3month_ip_99p", label: "Test: Gemini Ultra 99% off", tag: "TEST", plan: "30tb" },
    { sku: "com.google.one.30tb.m.3month_ip_99p", label: "Test: Google One 30TB 99% off", tag: "TEST", plan: "30tb" },
    { sku: "g1.play.20tb", label: "Test: Play 20TB", tag: "TEST", plan: "20tb" },
    { sku: "g1.play.ai.pro", label: "Test: Play AI Pro 30TB", tag: "TEST", plan: "30tb" },
    { sku: "g1.20tb.v2", label: "Test: g1.20tb.v2", tag: "TEST", plan: "20tb" },
    { sku: "g1.ai.pro", label: "Test: g1.ai.pro", tag: "TEST", plan: "30tb" }
  ];
  function presetTable() {
    return "<div class=scroll><table><thead><tr><th>Loại</th><th>Mã SKU</th><th>Mô tả</th><th>Thao tác</th></tr></thead><tbody>" +
      PRESET_SKUS.map(function (item) {
        var active = item.sku === CONFIGURED_TARGET;
        return "<tr" + (active ? " style=\"background:#eef8f2\"" : "") + "><td><strong>" + escape(item.tag) + "</strong></td><td><code>" + escape(item.sku) + "</code></td><td>" + escape(item.label) + "</td><td>" +
          (active ? "<span class=badge>Đang dùng</span>" : "<a href=\"" + ROOT + "?set_target=" + encodeURIComponent(item.sku) + "\">Chọn</a>") + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }
  function ultraTable() {
    return "<div class=scroll><table><thead><tr><th>Loại</th><th>Mã SKU</th><th>Mô tả</th><th>Thao tác</th></tr></thead><tbody>" +
      ULTRA_TEST_SKUS.map(function (item) {
        var key = item.plan === "20tb" ? "set_20tb" : "set_30tb";
        var current = item.plan === "20tb" ? CONFIGURED_20TB : CONFIGURED_30TB;
        var active = item.sku === current;
        return "<tr" + (active ? " style=\"background:#eef8f2\"" : "") + "><td><strong>" + escape(item.tag) + "</strong></td><td><code>" + escape(item.sku) + "</code></td><td>" + escape(item.label) + "</td><td>" +
          (active ? "<span class=badge>Đang dùng</span>" : "<a href=\"" + ROOT + "?" + key + "=" + encodeURIComponent(item.sku) + "\">Chọn</a>") + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  var latestScan = report.scan.recentResponses.length ?
    report.scan.recentResponses[report.scan.recentResponses.length - 1] : null;
  var scanVersionStatus = report.scan.version === COLLECTOR_VERSION ?
    "Dữ liệu từ phiên bản hiện tại." :
    report.scan.version ? "Dữ liệu cũ; chưa có dữ liệu từ phiên bản mới." : "Chưa có dữ liệu thu thập.";
  var statuses = {
    "rewritten": "Đã rewrite thành công",
    "no-match": "Không khớp SKU nào",
    "non-text": "Response không phải text"
  };
  var status = Object.prototype.hasOwnProperty.call(statuses, report.test.status) ?
    statuses[report.test.status] : "Chưa có dữ liệu";
  var html = [
    "<!doctype html><html lang=vi><meta charset=utf-8>",
    "<meta name=viewport content=\"width=device-width,initial-scale=1\"><title>Google One SKU - Bảng điều khiển</title>",
    "<style>body{font:16px/1.6 -apple-system,BlinkMacSystemFont,sans-serif;max-width:960px;margin:24px auto;padding:0 18px;color:#1c2737;background:#f5f7fa}section{background:white;border:1px solid #dde3ec;border-radius:12px;padding:18px;margin:18px 0}h1{font-size:24px;margin-bottom:10px}h2{font-size:20px}code{overflow-wrap:anywhere}a{color:#1259be}table{border-collapse:collapse;width:100%;font-size:14px}td,th{padding:9px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}.scroll{overflow:auto}.note{color:#46556b}.badge{display:inline-block;background:#e0f4e8;color:#176238;padding:4px 10px;border-radius:8px}.actions{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:20px 0}.actions form{margin:0}button,.actions a{font:inherit;padding:10px 16px;border:0;border-radius:8px;cursor:pointer;text-decoration:none}.actions a{background:#e4eaf3}.actions button{background:#1259be;color:white}button{background:#e4eaf3;color:#1c2737}</style>",
    "<h1>Google One - Bảng điều khiển SKU</h1>",
    "<p class=badge>Module đang hoạt động · " + VERSION + "</p>",
    "<nav class=actions><form method=get action=\"" + ROOT + "\"><button type=submit name=format value=json>Xuất JSON</button></form><a href=\"" + ROOT + "\">Làm mới</a></nav>",
    clearMessage ? "<p style=\"background:#fff8db;padding:12px;border-radius:8px;border:1px solid #e6d087\">" + escape(clearMessage) + "</p>" : "",
    "<section><h2>Chọn gói Pro 2TB / 5TB</h2>",
    "<p>Mục tiêu hiện tại: <code><strong>" + escape(CONFIGURED_TARGET) + "</strong></code></p>",
    "<p class=note>Bấm \"Chọn\" rồi quay lại Google app → Google One để kích hoạt.</p>",
    presetTable(), "</section>",
    "<section><h2>Chọn gói Ultra 20TB / 30TB (TEST)</h2>",
    "<p>Ultra 20TB hiện tại: <code><strong>" + escape(CONFIGURED_20TB) + "</strong></code><br>Ultra 30TB hiện tại: <code><strong>" + escape(CONFIGURED_30TB) + "</strong></code></p>",
    "<p class=note>Bấm \"Chọn\" → quay lại Google app → vào Ultra 20TB hoặc 30TB → xem checkout.</p>",
    ultraTable(), "</section>",
    "<section><h2>Lần rewrite gần nhất</h2>",
    "<p>Phiên bản: " + escape(report.test.version || "Chưa có") + "<br>Trạng thái: " + escape(status) + "; Tổng thay thế: " + report.test.hitCount + "; 2TB/Pro: " + report.test.annualHitCount + "</p>",
    "<p>Prefix: <code>g1.ios.2tb.</code><br>Mục tiêu: <code>" + escape(report.test.target || "Chưa có") + "</code><br>Thời gian (UTC): " + escape(report.test.updatedAt || "Chưa có") + "</p>",
    table(report.test.matchedFrom, false), "</section>",
    "<section><h2>Lịch sử thu thập</h2>",
    "<p>Script: <code>" + escape(report.scan.version || "Chưa có") + "</code><br>" + scanVersionStatus + "</p>",
    "<p>Response đã quét: " + report.scan.scannedResponses + "; Không phải text: " + report.scan.nonTextResponses +
      "; Có SKU: " + report.scan.matchedResponses + "; Tổng SKU: " + report.scan.skus.length + "</p>",
    recentTable(report.scan.recentResponses), "</section>",
    "<section><h2>Danh sách SKU đã thu thập</h2>",
    table(report.scan.skus, true), "</section>",
    "<form method=get action=\"" + ROOT + "\"><button name=clear value=1>Xoá dữ liệu thu thập</button></form>",
    "<p class=note>Mã nguồn mở: dựa trên <a href=\"https://github.com/crhywun/g1-acq\">crhywun/g1-acq</a> và PR #3. Mở rộng bởi tgai521 v8.0 + gnuolcud v8.1-ios.</p></html>"
  ].join("");
  $done({ response: { status: 200, headers: headers, body: html } });
})();

/* Local-only report & interactive SKU switcher served by a Shadowrocket http-request script.
 *
 * Attribution & Credits:
 *   - Based on `crhywun/g1-acq` (https://github.com/crhywun/g1-acq) by @crhywun
 *   - Extended in v8.0.0 with interactive 1-tap Safari target SKU switching & newly discovered 18M/15M/12M/6M/1Y free trial SKUs.
 */
"use strict";

(function () {
  var ROOT = "https://one.google.com/g1-sku-report";
  var VERSION = "v8.0.0";
  var COLLECTOR_VERSION = "g1-acq-v8.0";
  var DEFAULT_TARGET = "g1.2tb.ai.18months_eft";
  var TARGET_OVERRIDE_KEY = "g1.target.override.v1";
  var LEGACY_TARGET = "g1.2tb.ai.annual";
  var SCAN_KEY = "g1.sku.scan.v1";
  var TEST_KEY = "g1.pro.annual.test.v1";

  var PRESET_SKUS = [
    { sku: "g1.2tb.ai.18months_eft", label: "★ Pro 5TB · Mien phi 18 thang (eft-18months)", tag: "FREE 18T" },
    { sku: "g1.2tb.ai.15months_eft", label: "★ Pro 5TB · Mien phi 15 thang (eft-15months)", tag: "FREE 15T" },
    { sku: "g1.2tb.ai.12months_eft", label: "★ Pro 5TB · Mien phi 12 thang (eft-12months)", tag: "FREE 12T" },
    { sku: "g1.2tb.ai.subs_variant", label: "Pro 5TB · Mien phi 12/6 thang bien the (subs_variant)", tag: "FREE 12T/6T" },
    { sku: "g1.play.2tb.ai.student", label: "★ Pro 5TB · Sinh vien mien phi 12 thang (eft-12mo)", tag: "FREE 12T" },
    { sku: "g1.2tb.ai.6months_eft", label: "Pro 5TB · Mien phi 6 thang (eft-6months)", tag: "FREE 6T" },
    { sku: "g1.2tb.ai.4months_eft", label: "Pro 5TB · Mien phi 4 thang (eft-4months)", tag: "FREE 4T" },
    { sku: "g1.2tb.ai.3months_eft", label: "Pro 5TB · Mien phi 3 thang (eft-3months)", tag: "FREE 3T" },
    { sku: "g1.2tb.ai.2months_eft", label: "Pro 5TB · Mien phi 2 thang (eft-2months)", tag: "FREE 2T" },
    { sku: "g1.2tb.ai.12months_ip_90p", label: "Pro 5TB · Giam 90% 12 thang ($1.99/thang x 12 = $23.88)", tag: "$1.99x12T" },
    { sku: "g1.2tb.ai.3months_ip_90p.acq", label: "Pro 5TB · Giam 90% 3 thang ($1.99/thang x 3)", tag: "$1.99x3T" },
    { sku: "g1.2tb.ai.1month_ip_95p.acq", label: "Pro 5TB · Giam 95% thang dau ($0.99/thang dau)", tag: "$0.99x1T" },
    { sku: "g1.2tb.1year_eft", label: "★ AI Plus 2TB · Mien phi 12 thang (1year_eft)", tag: "FREE 12T" },
    { sku: "g1.2tb.6months_eft", label: "AI Plus 2TB · Mien phi 6 thang (6months_eft)", tag: "FREE 6T" },
    { sku: "g1.2tb.subs_variant", label: "AI Plus 2TB · Mien phi 6/3 thang bien the", tag: "FREE 6T/3T" },
    { sku: "g1.play.helium", label: "★ AI Plus 400GB · Mien phi 12 thang (eft-12mo)", tag: "FREE 12T" },
    { sku: "g1.play.helium.student", label: "AI Plus 400GB · Sinh vien mien phi 12 thang", tag: "FREE 12T" },
    { sku: "g1.helium.12months_ip_90p", label: "AI Plus 400GB · Giam 90% 12 thang ($0.49/thang x 12 = $5.88/nam)", tag: "$0.49x12T" },
    { sku: "g1.100gb.1year_eft", label: "★ 100GB · Mien phi 12 thang (1year_eft)", tag: "FREE 12T" },
    { sku: "g1.100gb.9months_eft", label: "★ 100GB · Mien phi 9 thang (9months_eft)", tag: "FREE 9T" },
    { sku: "g1.200gb.1year_eft", label: "★ 200GB · Mien phi 12 thang (1year_eft)", tag: "FREE 12T" }
  ];

  var url = typeof $request === "object" && $request ? $request.url : "";
  if (typeof url !== "string" || !/^https:\/\/one\.google\.com\/g1-sku-report\/?(?:\?|$)/.test(url)) {
    $done({});
    return;
  }

  var storageAvailable = typeof $persistentStore !== "undefined" &&
    typeof $persistentStore.read === "function";
  var clearMessage = "";

  // Handle interactive target switching via ?set_target=<sku>
  var targetMatch = /(?:\?|&)set_target=([A-Za-z0-9._-]+)(?:&|$)/.exec(url);
  if (targetMatch && storageAvailable) {
    var newTarget = decodeURIComponent(targetMatch[1]);
    if (/^g1\.[A-Za-z0-9._-]{2,120}$/.test(newTarget)) {
      try {
        var okWrite = $persistentStore.write(newTarget, TARGET_OVERRIDE_KEY);
        clearMessage = okWrite ? ("✅ Da chuyen muc tieu 2TB/Pro thanh: " + newTarget + " (vao lai Google One de kich hoat)") : "Luu that bai.";
      } catch (e) {
        clearMessage = "Bo nho chua san sang.";
      }
    }
  }

  if (/(?:\?|&)clear=1(?:&|$)/.test(url)) {
    try {
      var scanCleared = $persistentStore.write("{}", SCAN_KEY);
      var testCleared = $persistentStore.write("{}", TEST_KEY);
      clearMessage = scanCleared && testCleared ? "Da xoa sach du lieu." : "Xoa chua hoan tat.";
    } catch (error) {
      clearMessage = "Bo nho chua san sang.";
    }
  }

  var CONFIGURED_TARGET = DEFAULT_TARGET;
  if (storageAvailable) {
    try {
      var custom = ($persistentStore.read(TARGET_OVERRIDE_KEY) || "").trim();
      if (/^g1\.[A-Za-z0-9._-]{2,120}$/.test(custom)) {
        CONFIGURED_TARGET = custom;
      }
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
    "new-skus": "Tim thay SKU moi",
    "known-skus": "SKU da co trong danh sach",
    "no-skus": "Khong co SKU trong response",
    "limit-reached": "Dat gioi han thu thap",
    "non-text": "Response khong phai text"
  };
  var scanPaths = ["/", "/ai", "/plans", "/_/…/data/batchexecute", "[其他 one.google.com 路径]"];
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
        path: scanPaths.indexOf(event.path) !== -1 ? event.path : "[其他 one.google.com 路径]",
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
    if (!row.fallback) return "Khong";
    var discount = /_ip_(\d+p)\.acq$/.exec(row.to || "");
    return discount ? discount[1] : "是";
  }
  function table(items, withTime) {
    if (!items.length) return "<p>Chua co du lieu.</p>";
    return "<div class=scroll><table><thead><tr><th>Ma SKU</th><th>So lan</th>" +
      (withTime ? "<th>Lan cuoi (UTC)</th>" : "<th>SKU muc tieu</th><th>Du phong</th>") + "</tr></thead><tbody>" +
      items.map(function (row) {
        return "<tr><td><code>" + escape(row.id) + "</code></td><td>" + row.count + "</td>" +
          (withTime ? "<td>" + escape(row.lastSeen) + "</td>" :
            "<td><code>" + escape(row.to || "Chua ghi") + "</code></td><td>" + fallbackName(row) + "</td>") + "</tr>";
      }).join("") + "</tbody></table></div>";
  }
  function recentTable(events) {
    if (!events.length) return "<p>Chua co lich su response.</p>";
    return "<div class=scroll><table><thead><tr><th>Thoi gian (UTC)</th><th>Duong dan</th><th>Ket qua</th><th>SKU tim thay</th><th>Moi them</th><th>Vuot gioi han</th></tr></thead><tbody>" +
      events.slice().reverse().map(function (event) {
        return "<tr><td>" + escape(event.at) + "</td><td>" + escape(event.path) +
          "</td><td>" + scanStatuses[event.status] + "</td><td>" + event.candidateCount +
          "</td><td>" + event.addedCount + "</td><td>" + event.omittedCount + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }
  function presetTable() {
    return "<div class=scroll><table><thead><tr><th>Loai</th><th>Ma SKU</th><th>Mo ta</th><th>Thao tac</th></tr></thead><tbody>" +
      PRESET_SKUS.map(function (item) {
        var active = item.sku === CONFIGURED_TARGET;
        return "<tr" + (active ? " style=\"background:#eef8f2\"" : "") + "><td><strong>" + escape(item.tag) + "</strong></td><td><code>" + escape(item.sku) + "</code></td><td>" + escape(item.label) + "</td><td>" +
          (active ? "<span class=badge>Dang dung</span>" : "<a href=\"" + ROOT + "?set_target=" + encodeURIComponent(item.sku) + "\">Chon goi nay</a>") + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  var latestScan = report.scan.recentResponses.length ?
    report.scan.recentResponses[report.scan.recentResponses.length - 1] : null;
  var scanVersionStatus = report.scan.version === COLLECTOR_VERSION ?
    "Du lieu tu phien ban hien tai." :
    report.scan.version ? "Du lieu cu; chua co du lieu tu phien ban moi." : "Chua co du lieu thu thap.";
  var statuses = {
    "rewritten": "Da rewrite thanh cong",
    "no-match": "Khong khop SKU nao",
    "non-text": "Response khong phai text"
  };
  var status = Object.prototype.hasOwnProperty.call(statuses, report.test.status) ?
    statuses[report.test.status] : "Chua co du lieu";
  var html = [
    "<!doctype html><html lang=vi><meta charset=utf-8>",
    "<meta name=viewport content=\"width=device-width,initial-scale=1\"><title>Google One SKU - Bang dieu khien</title>",
    "<style>body{font:16px/1.6 -apple-system,BlinkMacSystemFont,sans-serif;max-width:960px;margin:24px auto;padding:0 18px;color:#1c2737;background:#f5f7fa}section{background:white;border:1px solid #dde3ec;border-radius:12px;padding:18px;margin:18px 0}h1{font-size:24px;margin-bottom:10px}h2{font-size:20px}code{overflow-wrap:anywhere}a{color:#1259be}table{border-collapse:collapse;width:100%;font-size:14px}td,th{padding:9px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}.scroll{overflow:auto}.note{color:#46556b}.badge{display:inline-block;background:#e0f4e8;color:#176238;padding:4px 10px;border-radius:8px}.actions{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:20px 0}.actions form{margin:0}button,.actions a{font:inherit;padding:10px 16px;border:0;border-radius:8px;cursor:pointer;text-decoration:none}.actions a{background:#e4eaf3}.actions button{background:#1259be;color:white}button{background:#e4eaf3;color:#1c2737}</style>",
    "<h1>Google One - Bang dieu khien SKU</h1>",
    "<p class=badge>Module dang hoat dong · " + VERSION + "</p>",
    "<nav class=actions aria-label=Menu><form method=get action=\"" + ROOT + "\"><button type=submit name=format value=json>Xuat JSON</button></form><a href=\"" + ROOT + "\">Lam moi</a></nav>",
    clearMessage ? "<p style=\"background:#fff8db;padding:12px;border-radius:8px;border:1px solid #e6d087\">" + escape(clearMessage) + "</p>" : "",
    "<section><h2>Chon goi 2TB / Pro 5TB</h2>",
    "<p>Muc tieu hien tai cua <code>g1.ios.2tb.*</code>: <code><strong>" + escape(CONFIGURED_TARGET) + "</strong></code></p>",
    "<p class=note>Bam \"Chon goi nay\" de chuyen SKU ngay tren iPhone. Sau do vao lai Google One app de kich hoat. Ultra 20TB/30TB tu dong giu <code>g1.20tb.1month_eft.acq</code> / <code>g1.ai.ultra.1month_eft.acq</code> (tu dong fallback 90%).</p>",
    presetTable(), "</section>",
    "<section><h2>Lan rewrite gan nhat</h2>",
    "<p>Phien ban: " + escape(report.test.version || "Chua co") + "<br>Trang thai: " + escape(status) + "; Tong so thay the: " + report.test.hitCount + "; 2TB/Pro: " + report.test.annualHitCount + "</p>",
    "<p>Prefix 2TB: <code>g1.ios.2tb.</code><br>Muc tieu 2TB: <code>" + escape(report.test.target || "Chua co") + "</code><br>Thoi gian (UTC): " + escape(report.test.updatedAt || "Chua co") + "</p>",
    table(report.test.matchedFrom, false), "</section>",
    "<section><h2>Lich su thu thap</h2>",
    "<p>Script thu thap: <code>" + escape(report.scan.version || "Chua co") + "</code><br>" + scanVersionStatus + "</p>",
    "<p>Response da quet: " + report.scan.scannedResponses + "; Response khong phai text: " + report.scan.nonTextResponses +
      "; Response co SKU: " + report.scan.matchedResponses + "; Tong SKU: " + report.scan.skus.length + "</p>",
    "<h3>10 response gan nhat</h3>", recentTable(report.scan.recentResponses), "</section>",
    "<section><h2>Danh sach SKU da thu thap</h2>",
    table(report.scan.skus, true), "</section>",
    "<form method=get action=\"" + ROOT + "\"><button name=clear value=1>Xoa du lieu thu thap</button></form>",
    "<p class=note>开源致谢：本项目基于 <a href=\"https://github.com/crhywun/g1-acq\">crhywun/g1-acq</a> 与 PR #3 (@cehomecambodia-lang) 扩展构建。</p></html>"
  ].join("");
  $done({ response: { status: 200, headers: headers, body: html } });
})();

var body = $response.body;
if (body) {
  // Ultra 30TB: thử free 12 tháng → free 3 tháng → free 1 tháng (confirmed)
  if (body.indexOf("g1.ai.ultra.12months_eft.acq") !== -1) {
    body = body.replace(/g1\.ios\.30tb\.ai\.pro\.m/g, "g1.ai.ultra.12months_eft.acq");
  } else if (body.indexOf("g1.ai.ultra.3months_eft.acq") !== -1) {
    body = body.replace(/g1\.ios\.30tb\.ai\.pro\.m/g, "g1.ai.ultra.3months_eft.acq");
  } else {
    body = body.replace(/g1\.ios\.30tb\.ai\.pro\.m/g, "g1.ai.ultra.1month_eft.acq");
  }
  // 20TB: thử free 12 tháng → free 3 tháng → giảm 90%
  if (body.indexOf("g1.20tb.12months_eft.acq") !== -1) {
    body = body.replace(/g1\.ios\.20tb\.m\.v2/g, "g1.20tb.12months_eft.acq");
  } else if (body.indexOf("g1.20tb.3months_eft.acq") !== -1) {
    body = body.replace(/g1\.ios\.20tb\.m\.v2/g, "g1.20tb.3months_eft.acq");
  } else {
    body = body.replace(/g1\.ios\.20tb\.m\.v2/g, "g1.20tb.3months_ip_90p.acq");
  }
  // Pro 5TB: thử free 12 tháng → free 6 tháng → giảm 90% 12 tháng
  if (body.indexOf("g1.2tb.ai.12months_eft.acq") !== -1) {
    body = body.replace(/g1\.ios\.2tb\.[A-Za-z0-9._-]+/g, "g1.2tb.ai.12months_eft.acq");
  } else if (body.indexOf("g1.2tb.ai.6months_eft.acq") !== -1) {
    body = body.replace(/g1\.ios\.2tb\.[A-Za-z0-9._-]+/g, "g1.2tb.ai.6months_eft.acq");
  } else {
    body = body.replace(/g1\.ios\.2tb\.[A-Za-z0-9._-]+/g, "g1.2tb.ai.12months_ip_90p");
  }
  $done({body});
} else {
  $done({});
}

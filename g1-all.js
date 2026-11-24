var body = $response.body;
if (body) {
  body = body.replace(/g1\.ios\.30tb\.ai\.pro\.m/g, "g1.ai.ultra.1month_eft.acq");
  body = body.replace(/g1\.ios\.20tb\.m\.v2/g, "g1.20tb.3months_ip_90p.acq");
  body = body.replace(/g1\.ios\.2tb\.[A-Za-z0-9._-]+/g, "g1.2tb.ai.12months_ip_90p");
  $done({body});
} else {
  $done({});
}

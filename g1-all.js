var body = $response.body;
if (body) {
  body = body.replace(/g1\.ios\.30tb\.ai\.pro\.m/g, "g1.ai.ultra.1month_eft.acq");
  body = body.replace(/g1\.ios\.20tb\.m\.v2/g, "g1.20tb.3months_ip_90p.acq");
  $done({body});
} else {
  $done({});
}

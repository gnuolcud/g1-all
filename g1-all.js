var body = $response.body;
if (body) {
  // Ultra 30TB: free 12 tháng
  body = body.replace(/g1\.ios\.30tb\.ai\.pro\.m/g, "g1.ai.ultra.12months_eft.acq");
  $done({body});
} else {
  $done({});
}

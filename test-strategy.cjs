const fetch = require('node-fetch');

async function test() {
  const res = await fetch("http://localhost:3000/api/agent/strategy?simulationId=ecd3406b-c293-4a18-a16d-cb67647e3223");
  const text = await res.text();
  console.log("STATUS:", res.status);
  console.log("RESPONSE:", text);
}
test();

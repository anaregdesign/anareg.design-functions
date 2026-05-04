const {execFileSync} = require("node:child_process");

let auditOutput = "";

try {
  auditOutput = execFileSync("npm", ["audit", "--json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (error) {
  auditOutput = error.stdout?.toString() ?? "";
}

const report = JSON.parse(auditOutput);
const counts = report.metadata?.vulnerabilities ?? {};
const critical = counts.critical ?? 0;
const high = counts.high ?? 0;

if (critical > 0 || high > 0) {
  console.error(
    `High severity npm audit findings remain: ` +
      `critical=${critical}, high=${high}`
  );
  process.exit(1);
}

console.log("No high or critical npm audit findings.");

const low = counts.low ?? 0;
const moderate = counts.moderate ?? 0;

if (low > 0 || moderate > 0) {
  console.log(
    `Remaining low/moderate findings: low=${low}, moderate=${moderate}`
  );
}

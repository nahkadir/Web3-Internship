// simulate many users trying to book seats for the same event at the same time
// then check whether backend prevents overbooking

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, value] = arg.replace(/^--/, "").split("=");
    return [key, value];
  }),
);

const BASE_URL = process.env.BASE_URL || "http://localhost:5000/api";
const TOKEN = process.env.TEST_TOKEN;
const EVENT_ID = args.eventId || process.env.TEST_EVENT_ID;
const REQUESTS = Number(args.requests || process.env.TEST_REQUESTS || 20);
const SEATS_PER_REQUEST = args.seats ? args.seats.split(",").map(Number) : null; // null means "use a fixed quantity for every request"
const FIXED_QUANTITY = Number(args.quantity || process.env.TEST_QUANTITY || 1);

if (!TOKEN || !EVENT_ID) {
  console.error(
    "Usage: TEST_TOKEN=<jwt> node scripts/concurrency-test.js --eventId=<id> --requests=20 --quantity=1\n" +
      "   or: --seats=4,3,5,2  (comma-separated per-request quantities, overrides --requests/--quantity)",
  );
  process.exit(1);
}

const quantities = SEATS_PER_REQUEST || Array(REQUESTS).fill(FIXED_QUANTITY);

const bookOnce = async (n, quantity) => {
  const start = performance.now();
  const res = await fetch(`${BASE_URL}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ eventId: EVENT_ID, quantity }),
  });
  const durationMs = performance.now() - start;
  const body = await res.json();
  return { n, quantity, status: res.status, message: body.message, durationMs };
};

const run = async () => {
  console.log(
    `Firing ${quantities.length} concurrent requests against event ${EVENT_ID}`,
  );
  console.log(`Quantities: ${quantities.join(", ")}\n`);

  const results = await Promise.all(
    quantities.map((q, i) => bookOnce(i + 1, q)),
  );

  results
    .sort((a, b) => a.n - b.n)
    .forEach((r) =>
      console.log(
        `Request ${r.n} (qty ${r.quantity}): ${r.status} - ${r.message} [${r.durationMs.toFixed(0)}ms]`,
      ),
    );

  const succeeded = results.filter((r) => r.status === 201);
  const failed = results.filter((r) => r.status !== 201);
  const totalSeatsBooked = succeeded.reduce((sum, r) => sum + r.quantity, 0);
  const avgResponseTime =
    results.reduce((sum, r) => sum + r.durationMs, 0) / results.length;

  console.log("\n--- Summary ---");
  console.log(`Total requests:      ${results.length}`);
  console.log(`Successful:          ${succeeded.length}`);
  console.log(`Failed:              ${failed.length}`);
  console.log(`Total seats booked:  ${totalSeatsBooked}`);
  console.log(`Avg response time:   ${avgResponseTime.toFixed(1)}ms`);

  const nonConflictFailures = failed.filter((r) => r.status !== 409);
  if (nonConflictFailures.length > 0) {
    console.log(
      `\n⚠ ${nonConflictFailures.length} failure(s) were NOT clean 409s:`,
    );
    nonConflictFailures.forEach((r) =>
      console.log(`  Request ${r.n}: ${r.status} - ${r.message}`),
    );
  }
};

run();

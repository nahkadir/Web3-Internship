import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Ticket from "../models/Ticket.js";
import { SLA_TARGETS } from "../constants/sla.js";

await connectDB();

await Ticket.updateMany(
  { firstRespondedAt: { $exists: false } },
  { $set: { firstRespondedAt: null } },
);
await Ticket.updateMany(
  { slaFirstResponseBreached: { $exists: false } },
  { $set: { slaFirstResponseBreached: false } },
);
await Ticket.updateMany(
  { slaResolutionBreached: { $exists: false } },
  { $set: { slaResolutionBreached: false } },
);
await Ticket.updateMany(
  { slaWarned: { $exists: false } },
  { $set: { slaWarned: { firstResponse: false, resolution: false } } },
);

let count = 0;
for await (const t of Ticket.find({ firstResponseDueAt: null })) {
  const target = SLA_TARGETS[t.priority];
  await Ticket.updateOne(
    { _id: t._id },
    {
      $set: {
        firstResponseDueAt: new Date(
          t.createdAt.getTime() + target.firstResponseMs,
        ),
        resolutionDueAt: new Date(t.createdAt.getTime() + target.resolutionMs),
      },
    },
  );
  count++;
}

console.log(`Backfilled ${count} tickets`);
await mongoose.disconnect();

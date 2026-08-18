import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import { creditsService } from '../src/services/credits.service.js';
import { connectDB, disconnectDB } from '../src/config/database.js';

dotenv.config();

await connectDB();

try {
  const users = await User.find({}, { _id: 1 }).lean();
  let normalized = 0;
  let reset = 0;
  const now = Date.now();

  for (const user of users) {
    const before = await User.findById(user._id, {
      remainingCredits: 1,
      lastCreditReset: 1,
      currentPlan: 1,
      usingOwnApiKey: 1,
      planAcknowledged: 1,
    }).lean();
    const previousCredits = before?.remainingCredits;
    const previousReset = before?.lastCreditReset;
    const previousResetTime = previousReset ? new Date(previousReset).getTime() : NaN;
    const missingFields = previousCredits == null
      || previousReset == null
      || before?.currentPlan == null
      || before?.usingOwnApiKey == null
      || before?.planAcknowledged == null;
    const invalidReset = Number.isNaN(previousResetTime);
    const wasExpired = !before?.usingOwnApiKey?.active
      && !invalidReset
      && now - previousResetTime >= 24 * 60 * 60 * 1000;
    const updated = await creditsService.syncStoredCredits(user._id);

    if (!updated) continue;
    if (missingFields || invalidReset || wasExpired) normalized += 1;
    if (wasExpired && updated.remainingCredits === 20) reset += 1;

    if (missingFields || invalidReset) {
      console.log(`normalizado: ${user._id}`);
    }
  }

  console.log(JSON.stringify({ scanned: users.length, normalized, reset }, null, 2));
} finally {
  await disconnectDB();
  await mongoose.disconnect().catch(() => {});
}

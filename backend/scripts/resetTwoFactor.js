/**
 * resetTwoFactor.js: turn two-step sign-in OFF for the admin account.
 *
 * For when the authenticator app and every recovery code are lost, or after
 * JWT_SECRET has been changed (the stored code secret is encrypted with a key
 * derived from it, so it can no longer be read). Needs the database
 * connection string, so only someone holding the server's secrets can run it.
 *
 * Usage (from backend/):
 *   node --env-file=.env scripts/resetTwoFactor.js            # shows the state
 *   node --env-file=.env scripts/resetTwoFactor.js --apply    # turns it off
 *
 * Turning it off also signs out every browser (tokenVersion is bumped).
 * Sign in with the password, then set it up again in Studio -> Account.
 */
import mongoose from 'mongoose';
import AdminUser from '../models/AdminUser.js';

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set. Run with: node --env-file=.env scripts/resetTwoFactor.js');
  process.exit(1);
}

const apply = process.argv.includes('--apply');
await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15_000 });

const users = await AdminUser.find({}).select('totpEnabled recoveryCodes tokenVersion');
for (const user of users) {
  console.log(`Admin ${user._id}: two-step sign-in ${user.totpEnabled ? 'ON' : 'off'}, ${user.recoveryCodes.length} recovery codes left`);
  if (apply && user.totpEnabled) {
    await AdminUser.updateOne(
      { _id: user._id },
      {
        $set: { totpEnabled: false, totpSecret: '', totpPending: '', totpLastStep: -1, recoveryCodes: [] },
        $inc: { tokenVersion: 1 },
      }
    );
    console.log('  -> turned off; every browser signed out.');
  }
}
if (!apply) console.log('Dry run. Add --apply to turn it off.');
await mongoose.disconnect();

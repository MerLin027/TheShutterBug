/**
 * Move existing photographs behind signed delivery (Phase D10).
 *
 * Photos uploaded before D10 are Cloudinary `upload` assets: their original
 * file has a public URL. This renames each one to `authenticated` (same
 * public_id), after which only URLs signed by the API resolve, and records
 * the new type on the row so the API signs for the right type.
 *
 * Covers every Photo row and the uploaded Home hero (the default placeholder
 * isn't a Cloudinary asset and is left alone).
 *
 *   node --env-file=.env scripts/protectImages.js            # dry run: lists what would change
 *   node --env-file=.env scripts/protectImages.js --apply    # do it
 *   node --env-file=.env scripts/protectImages.js --revert   # back to public `upload`
 *
 * Safe to re-run: rows already at the target type are skipped. One asset at
 * a time, and each row is updated only after its rename succeeds, so a
 * failure part-way leaves every row matching its asset.
 */
import mongoose from 'mongoose';
import { cloudinary } from '../config/cloudinary.js';
import Photo from '../models/Photo.js';
import SiteContent from '../models/SiteContent.js';

const apply = process.argv.includes('--apply');
const revert = process.argv.includes('--revert');
const from = revert ? 'authenticated' : 'upload';
const to = revert ? 'upload' : 'authenticated';
const live = apply || revert;

async function move(publicId) {
  const result = await cloudinary.uploader.rename(publicId, publicId, {
    type: from,
    to_type: to,
    invalidate: true,
    overwrite: false,
  });
  return result.secure_url;
}

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15_000 });

let moved = 0;
let failed = 0;

const photos = await Photo.find({ deliveryType: { $ne: to } }).select('cloudinaryId deliveryType');
const pending = photos.filter((p) => (p.deliveryType || 'upload') === from);
console.log(`${live ? 'Moving' : 'Would move'} ${pending.length} photo(s) ${from} -> ${to}`);

for (const photo of pending) {
  if (!live) {
    console.log(`  - photo ${photo._id}`);
    continue;
  }
  try {
    const url = await move(photo.cloudinaryId);
    await Photo.updateOne({ _id: photo._id }, { $set: { deliveryType: to, imageUrl: url } });
    moved++;
    console.log(`  ok photo ${photo._id}`);
  } catch (err) {
    failed++;
    console.error(`  FAILED photo ${photo._id}: ${err?.error?.message || err.message}`);
  }
}

const content = await SiteContent.findOne({}).select('heroImageId heroImageType');
if (content?.heroImageId && (content.heroImageType || 'upload') === from) {
  if (!live) {
    console.log('Would move the Home hero');
  } else {
    try {
      const url = await move(content.heroImageId);
      await SiteContent.updateOne({ _id: content._id }, { $set: { heroImageType: to, heroImageUrl: url } });
      moved++;
      console.log('  ok Home hero');
    } catch (err) {
      failed++;
      console.error(`  FAILED Home hero: ${err?.error?.message || err.message}`);
    }
  }
} else {
  console.log('Home hero: nothing to move (placeholder, or already moved)');
}

if (live) console.log(`Done: ${moved} moved, ${failed} failed.`);
await mongoose.disconnect();
process.exit(failed ? 1 : 0);

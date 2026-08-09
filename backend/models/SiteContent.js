import mongoose from 'mongoose';

/**
 * Editable copy for the public About page.
 *
 * This is a singleton collection — there is only ever one document, created
 * on the first PUT via upsert. Routes must never assume it exists: a fresh
 * database has no document at all, and GET falls back to DEFAULTS so About
 * renders real copy instead of blanks.
 *
 * DEFAULTS is the copy that was hardcoded in src/app/about/page.tsx before
 * this model existed. Keeping it verbatim means a fresh deploy looks
 * identical to the pre-Stage-2 site.
 */
export const DEFAULTS = {
  quote: 'Chasing light, quietly.',
  bio: [
    'I am a photographer working mostly at the edges of the day — the hour before the sun clears the horizon, and the long blue minutes after it drops behind it.',
    'My work is about absence as much as presence: an empty platform, a road with nobody on it, one boat holding the centre of an enormous stretch of water. When people appear in a frame, they are weather, not subject.',
    'I shoot on a mix of digital and film, print small, and travel light. The Shutter Bug is where the work collects.',
  ].join('\n\n'),
  // The portrait About actually renders. Note this is a full URL, not a path
  // into public/ — that directory is empty, so a relative path would 404.
  aboutImageUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCFd3kHx3f7TeKHtxF_JbbMOx1gcgGN2yJwun0sRZTvkpH0C5Os9LO4SOCnp3UlHBkmbBdbD9r7C6ScpOSyILvBtEOoSi0flavIB50fRf7kmqOL86vKVCMADob9KFsiurnit21aw1Oq79dX5bfimo8ulSvwskvjA7fhD8eVHmylQFGnnJfLDtoxMj4pehyK71qvCKTeclW6BetKTFL02lrphZAeuRvfWazNDSz6sSrgd0PZuCEQBN_D',
};

const siteContentSchema = new mongoose.Schema({
  quote: {
    type: String,
    trim: true,
    default: DEFAULTS.quote,
  },
  bio: {
    // Paragraphs are separated by a blank line; the About page splits on
    // /\n\s*\n/ and maps each chunk to its own <p>.
    type: String,
    default: DEFAULTS.bio,
  },
  aboutImageUrl: {
    type: String,
    trim: true,
    default: DEFAULTS.aboutImageUrl,
  },
}, { timestamps: true });

export default mongoose.model('SiteContent', siteContentSchema);

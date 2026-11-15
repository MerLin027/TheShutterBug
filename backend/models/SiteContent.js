import mongoose from 'mongoose';
import { signedImageSet } from '../config/cloudinary.js';

/**
 * Editable copy for the public About page, and the Home page's hero image
 * and "The work" statement.
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

  // ── Home page (Studio → Home page, 2026-11-15) ──
  // The hero photograph. The default is the placeholder Home has always
  // shown; an upload replaces it with a Cloudinary asset.
  heroImageUrl:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBN4WALWq_emxJIYSU6-Ph6fTn37OTV7OLsoCQ18yhMT1Ch35bNiLM4PlaQGpX7yMywVF0SKr_lWFJ0A6ljA2Yse8ng0wVoQcgD1VWlj6NH6Vg-IzAvUuJumBOqGqNybIThpITt94pICLEZ8H6K_d4Wb02uA12APN9PrHFTTgDRm8p5-amoOw1XUMQii1fxOS90Sa87ajqewjmm2EyiY2NfdJGKNZS3vFiAIkpfpm1A2Y83s1FHV9wH=w2400',
  heroImageAlt: 'A lone rowing boat on still water at dusk, mirrored in the lake',
  // "The work" statement on Home. Empty means "use the second paragraph of
  // the bio", which is what Home showed before this field existed.
  showWorkStatement: true,
  workStatement: '',
};

export const HERO_ALT_MAX = 300;
export const WORK_STATEMENT_MAX = 1000;

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
  heroImageUrl: {
    type: String,
    trim: true,
    default: DEFAULTS.heroImageUrl,
  },
  // Cloudinary public_id of an UPLOADED hero, so the previous one can be
  // released when it is replaced. Empty for the default placeholder (which
  // is not ours to delete). Never sent to clients — see routes/siteContent.js.
  heroImageId: {
    type: String,
    default: '',
  },
  // Delivery type of that asset ('authenticated' since D10) and its stored
  // format, for the owner's private download link. Never sent to clients.
  heroImageType: {
    type: String,
    enum: ['upload', 'authenticated'],
    default: 'upload',
  },
  heroImageFormat: {
    type: String,
    default: '',
  },
  heroImageAlt: {
    type: String,
    trim: true,
    maxlength: [HERO_ALT_MAX, `Image description must be ${HERO_ALT_MAX} characters or fewer`],
    default: DEFAULTS.heroImageAlt,
  },
  showWorkStatement: {
    type: Boolean,
    default: DEFAULTS.showWorkStatement,
  },
  workStatement: {
    type: String,
    trim: true,
    maxlength: [WORK_STATEMENT_MAX, `"The work" text must be ${WORK_STATEMENT_MAX} characters or fewer`],
    default: DEFAULTS.workStatement,
  },
}, {
  timestamps: true,
  // What leaves the server (Phase D10). For an uploaded hero, clients get
  // `heroImages`, signed size-capped delivery URLs; the stored original's
  // URL, public_id, type and format stay here. The default placeholder (no
  // id) keeps its plain heroImageUrl: it isn't ours, and there's nothing to
  // protect.
  toJSON: {
    transform(doc, ret) {
      if (doc.heroImageId) {
        ret.heroImages = signedImageSet(doc.heroImageId, doc.heroImageType);
        delete ret.heroImageUrl;
      }
      delete ret.heroImageId;
      delete ret.heroImageType;
      delete ret.heroImageFormat;
      delete ret.__v;
      return ret;
    }
  }
});

export default mongoose.model('SiteContent', siteContentSchema);

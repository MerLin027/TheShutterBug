// The App Router runs on React canary (bundled by Next), which exports
// <ViewTransition>. The stable @types/react doesn't declare it; this pulls in
// the canary declarations that ship in the same package.
/// <reference types="react/canary" />

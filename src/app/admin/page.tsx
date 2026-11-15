import { randomInt } from "node:crypto";
import { connection } from "next/server";
import SignInClient from "./SignInClient";
import { SIGN_IN_PHOTOS } from "./signInPhotos";

/** A fresh random pick per request (server only). */
function pickPhotoIndex(): number {
  return randomInt(SIGN_IN_PHOTOS.length);
}

/**
 * Studio sign-in. A different photograph on each visit (signInPhotos.ts).
 *
 * Rendered per request — `connection()` opts out of prerendering — so the
 * pick happens on the server: the chosen photo is in the first HTML and
 * starts loading at once. SignInClient then makes sure a refresh never
 * repeats the previous photo. Nothing here touches the backend.
 */
export default async function AdminLoginPage() {
  await connection();
  return <SignInClient photos={SIGN_IN_PHOTOS} initialIndex={pickPhotoIndex()} />;
}

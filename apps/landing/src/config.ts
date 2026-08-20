// ============================================================
// SET THIS before deploying — the real APK download URL, e.g.
// an EAS build artifact link, or a file hosted in Supabase
// Storage / Vercel. Must be a direct link to the .apk file.
// See README.md for the tradeoffs between hosting options.
// ============================================================
export const APK_DOWNLOAD_URL = "https://expo.dev/artifacts/eas/EuJUVC-iICOWGj7nkzfaRm8_YcP_yn1vY-Jt43dp2Hg.apk";

export const isApkUrlConfigured = () => APK_DOWNLOAD_URL !== "https://expo.dev/artifacts/eas/EuJUVC-iICOWGj7nkzfaRm8_YcP_yn1vY-Jt43dp2Hg.apk";

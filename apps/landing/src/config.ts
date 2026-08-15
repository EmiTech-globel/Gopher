// ============================================================
// SET THIS before deploying — the real APK download URL, e.g.
// an EAS build artifact link, or a file hosted in Supabase
// Storage / Vercel. Must be a direct link to the .apk file.
// See README.md for the tradeoffs between hosting options.
// ============================================================
export const APK_DOWNLOAD_URL = "REPLACE_WITH_REAL_APK_URL";

export const isApkUrlConfigured = () => APK_DOWNLOAD_URL !== "REPLACE_WITH_REAL_APK_URL";

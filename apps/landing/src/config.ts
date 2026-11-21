// ============================================================
// The real APK download URL: an EAS build artifact link, or a file
// hosted in Supabase Storage. Must be a direct link to the .apk file.
// See README.md for the tradeoffs between hosting options.
// ============================================================
export const APK_DOWNLOAD_URL: string = "https://expo.dev/artifacts/eas/27SJlJhovcodur54JSHr1DFXN0nxC6JeA23q1cVtaOM.apk";

const PLACEHOLDER = "REPLACE_WITH_REAL_APK_URL";

// Auto-download only runs once a real URL is set. (The old check compared
// the URL against itself, so it was always false and never fired.)
export const isApkUrlConfigured = () => APK_DOWNLOAD_URL.trim() !== "" && APK_DOWNLOAD_URL !== PLACEHOLDER;

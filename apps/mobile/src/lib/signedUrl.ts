import { supabase } from "./supabase";

/**
 * Every evidence bucket in this app (scout-verification, proof-of-purchase,
 * balance-request-evidence, dispute-evidence) is private — RLS on
 * storage.objects controls who can read a given path, but the client
 * still needs a signed URL to actually render the image, since a private
 * bucket has no public URL. 1 hour is enough for a single viewing session
 * without leaving a link live indefinitely if it's ever copied out.
 */
export async function getSignedEvidenceUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error || !data) {
    console.error(`Failed to sign URL for ${bucket}/${path}`, error);
    return null;
  }
  return data.signedUrl;
}

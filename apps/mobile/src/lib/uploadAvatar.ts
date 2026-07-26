import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";

export async function pickAndUploadAvatar(userId: string): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });

  if (result.canceled || !result.assets[0]) return null;

  const uri = result.assets[0].uri;
  const response = await fetch(uri);
  const arrayBuffer = await response.arrayBuffer();
  const path = `${userId}/avatar-${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, arrayBuffer, { contentType: "image/jpeg", upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: data.publicUrl })
    .eq("id", userId);

  if (updateError) throw new Error(updateError.message);

  return data.publicUrl;
}
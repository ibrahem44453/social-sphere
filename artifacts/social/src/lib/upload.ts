import { supabase } from "./supabase";

export async function uploadPostImage(
  file: File,
  userId: string
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("post-images")
    .upload(safeName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(
      error.message.includes("not found") || error.message.includes("bucket")
        ? "Image storage is not configured. Please use an image URL instead."
        : `Upload failed: ${error.message}`
    );
  }

  const { data } = supabase.storage.from("post-images").getPublicUrl(safeName);
  return data.publicUrl;
}

export function isValidImageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      (u.protocol === "http:" || u.protocol === "https:") &&
      /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i.test(u.pathname)
    );
  } catch {
    return false;
  }
}

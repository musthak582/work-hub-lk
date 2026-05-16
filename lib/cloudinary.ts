import { v2 as cloudinary } from "cloudinary";

// Configure once (server-side only)
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
  secure:     true,
});

export { cloudinary };

// ============================================
// UPLOAD IMAGE FROM BASE64 OR URL
// Used in server actions
// ============================================
export async function uploadImage(
  source:  string, // base64 data URI or URL
  options: {
    folder:       string;
    publicId?:    string;
    maxWidth?:    number;
    maxHeight?:   number;
    quality?:     number;
  }
): Promise<{ url: string; publicId: string } | null> {
  try {
    const result = await cloudinary.uploader.upload(source, {
      folder:         `workhub/${options.folder}`,
      public_id:      options.publicId,
      overwrite:      true,
      resource_type:  "image",
      transformation: [
        {
          width:   options.maxWidth  ?? 1200,
          height:  options.maxHeight ?? 1200,
          crop:    "limit",
          quality: options.quality   ?? "auto:good",
          fetch_format: "auto",
        },
      ],
    });

    return {
      url:      result.secure_url,
      publicId: result.public_id,
    };
  } catch (err) {
    console.error("[Cloudinary] Upload error:", err);
    return null;
  }
}

// ============================================
// DELETE IMAGE
// ============================================
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("[Cloudinary] Delete error:", err);
  }
}

// ============================================
// GENERATE SIGNED UPLOAD PARAMS
// For direct browser → Cloudinary uploads
// (avoids routing large files through your server)
// ============================================
export function generateSignedUploadParams(folder: string): {
  signature:  string;
  timestamp:  number;
  apiKey:     string;
  cloudName:  string;
  folder:     string;
} {
  const timestamp = Math.round(Date.now() / 1000);
  const folderPath = `workhub/${folder}`;

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: folderPath },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    apiKey:    process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    folder:    folderPath,
  };
}
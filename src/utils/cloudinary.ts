import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

// Configure Multer to store files in memory (RAM) as buffer streams
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit files to 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

/**
 * Uploads an image buffer directly to Cloudinary using a stream
 */
export const uploadToCloudinary = (fileBuffer: Buffer, folderName: string): Promise<string> => {
  cloudinary.config({
    cloud_name: process.env["CLOUDINARY_CLOUD_NAME"]!,
    api_key: process.env["CLOUDINARY_API_KEY"]!,
    api_secret: process.env["CLOUDINARY_API_SECRET"]!,
  });

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        if (result) return resolve(result.secure_url);
        return reject(new Error("Upload failed with no result returned from Cloudinary."));
      }
    );

    // Write the buffer to the Cloudinary stream
    uploadStream.end(fileBuffer);
  });
};
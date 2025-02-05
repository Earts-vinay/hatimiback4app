const multer = require("multer");
const multerS3 = require("multer-s3");
const {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const path = require("path");

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.RAZORPAY_AWS_KEY_ID,
    secretAccessKey: process.env.RAZORPAY_AWS_KEY_Secret,
  },
  region: "us-east-1",
});

const s3Storage = multerS3({
  s3,
  bucket: "hatimi-production",
  metadata: (req, file, cb) => {
    cb(null, { fieldname: file.fieldname, "Content-Disposition": "inline" });
  },
  key: (req, file, cb) => {
    const folder = `${file.fieldname}/`;
    const fileName = `${Date.now()}_${file.fieldname}_${file.originalname}`;
    const key = folder + fileName;

    cb(null, key);
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
});

function sanitizeFile(file, cb) {
  const fileExts = [".png", ".jpg", ".jpeg", ".pdf", ".svg"];
  // Check allowed extensions
  const isAllowedExt = fileExts.includes(
    path.extname(file.originalname.toLowerCase())
  );
  // Mime type must be an image or PDF
  const isAllowedMimeType =
    file.mimetype.startsWith("image/") || file.mimetype === "application/pdf";

  if (isAllowedExt && isAllowedMimeType) {
    return cb(null, true);
  }
  cb("Error: File type not allowed!");
}
// our middleware
const uploadImage = multer({
  storage: s3Storage,
  fileFilter: (req, file, callback) => {
    sanitizeFile(file, callback);
  },
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});

const readImageContent = async (file) => {
  try {
    const response = await fetch(file.location);

    // Check if the response indicates success (status code 200)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return buffer;
  } catch (error) {
    console.error("Error reading image content:", error);
    throw error;
  }
};

const updateMultipleImages = async (originalKeys, updatedFiles) => {
  try {
    for (let i = 0; i < originalKeys.length; i++) {
      const originalKey = originalKeys[i];
      const updatedFile = updatedFiles[i];
      const updatedImageContent = await readImageContent(updatedFile);
      if (!updatedImageContent || updatedImageContent.length === 0) {
        throw new Error("Updated image content is empty");
      }
      const uploadParams = {
        Bucket: "hatimi-production",
        Key: updatedFile.key,
        Body: updatedImageContent,
        ContentType: updatedFile.mimetype,
      };
      await s3.send(new PutObjectCommand(uploadParams));
      const deleteParams = {
        Bucket: "hatimi-production",
        Key: originalKey,
      };
      await s3.send(new DeleteObjectCommand(deleteParams));
    }

    console.log("Images updated successfully");
  } catch (error) {
    console.error("Error updating images:", error);
    throw error;
  }
};

// Delete the image from S3
const deleteMultipleImages = async (keysToDelete) => {
  try {
    for (const keyToDelete of keysToDelete) {
      const deleteParams = {
        Bucket: "hatimi-production",
        Key: keyToDelete,
      };

      try {
        await s3.send(new DeleteObjectCommand(deleteParams));
        console.log(`File ${keyToDelete} deleted successfully`);
      } catch (deleteError) {
        if (deleteError.name === "NotFound") {
          console.warn(`File ${keyToDelete} not found in the S3 bucket`);
        } else {
          throw deleteError;
        }
      }
    }
  } catch (error) {
    console.error("Error deleting images:", error);
    throw error;
  }
};


const deleteSingleImage = async (keyToDelete) => {
  try {

      const deleteParams = {
        Bucket: "hatimi-production",
        Key: keyToDelete,
      };

      try {
        await s3.send(new DeleteObjectCommand(deleteParams));
        console.log(`File ${keyToDelete} deleted successfully`);
      } catch (deleteError) {
        if (deleteError.name === "NotFound") {
          console.warn(`File ${keyToDelete} not found in the S3 bucket`);
        } else {
          throw deleteError;
        }
      }

  } catch (error) {
    console.error("Error deleting images:", error);
    throw error;
  }
};

module.exports = { uploadImage, updateMultipleImages, deleteMultipleImages ,deleteSingleImage};

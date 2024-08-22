require('dotenv').config();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Configure AWS SDK
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadFileToS3 = async (file) => {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${Date.now()}_${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  const command = new PutObjectCommand(params);
  await s3Client.send(command);

  return {
    url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`,
    key: params.Key,
    size: file.size,
    type: file.mimetype,
    filename: file.originalname
  };
};

const uploadMiddleware = upload.single('file');

const handleFileUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).send({ error: 'No file uploaded' });
    }

    const file = req.file;
    const data = await uploadFileToS3(file);
    req.uploadResult = data; // Attach the result to the request object
    next(); // Call the next middleware or route handler
  } catch (err) {
    console.log('handleFileUpload error:', err);

    res.status(500).send({
      details: err.message
    });
  }
};

module.exports = { uploadMiddleware, handleFileUpload };
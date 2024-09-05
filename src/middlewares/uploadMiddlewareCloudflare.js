require('dotenv').config();
const multer = require('multer');
const AWS = require('aws-sdk');

// Set up environment variables
const ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_R2_API_TOKEN;
const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;

// Configure the AWS SDK to use Cloudflare R2
const s3 = new AWS.S3({
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: 'placeholderplaceholderplaceholde', // Use a placeholder, it's not validated when using an API token
  secretAccessKey: API_TOKEN, // Use your API Token here
  region: 'auto', // Required since R2 doesn't use specific AWS regions
  signatureVersion: 'v4' // Necessary for Cloudflare R2 compatibility
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadFileToCloudflare = async (file) => {
  if (!BUCKET_NAME) {
    throw new Error('Bucket name is not defined in environment variables');
  }

  const key = `${Date.now()}_${file.originalname}`;
  
  console.log('Uploaded file:', {
    endpoint: `https://${ACCOUNT_ID}.eu.r2.cloudflarestorage.com`,
    accessKeyId: 'placeholderplaceholderplaceholde', // Use a placeholder, it's not validated when using an API token
    secretAccessKey: API_TOKEN, // Use your API Token here
    region: 'auto', // Required since R2 doesn't use specific AWS regions
    signatureVersion: 'v4' // Necessary for Cloudflare R2 compatibility
  }, s3);


  await s3.upload({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype
  }).promise();


  return {
    url: `https://${ACCOUNT_ID}.eu.r2.cloudflarestorage.com/${BUCKET_NAME}/${key}`,
    key: key,
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
    const data = await uploadFileToCloudflare(file);
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
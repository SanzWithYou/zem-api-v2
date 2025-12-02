const AWS = require('aws-sdk');
require('dotenv').config();

const s3 = new AWS.S3({
  endpoint: process.env.OS_ENDPOINT_URL,
  accessKeyId: process.env.OS_ACCESS_KEY_ID,
  secretAccessKey: process.env.OS_SECRET_ACCESS_KEY,
  region: process.env.OS_REGION,
  s3ForcePathStyle: true,
});

module.exports = s3;

import * as AWS from 'aws-sdk';
import csv from 'csv-parser';

import { S3Event } from 'aws-lambda';

const importFileParser = async (event: S3Event) => {
  console.log("__EVENT:  ", JSON.stringify(event))

  const s3 = new AWS.S3({
    region: 'us-east-1',
  });
  const sqs = new AWS.SQS({
    region: 'us-east-1',
  });

  const record = event.Records[0];
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' ')); // S3 keyname decoding
    const bucketName = record.s3.bucket.name;

    console.log("__OBJECT: ", key)

    const params = {
      Bucket: bucketName,
      Key: key,
    };

    const newObjectName = key.replace('uploaded', 'parsed');

    // dirty hack
    await s3.copyObject({
      ...params,
      CopySource: `${bucketName}/${key}`,
    }).promise();

    console.log("__OBJECT COPIED");

    const stream = s3.getObject(params)
      .createReadStream();
    const parser = csv();

    stream.pipe(parser)
      .on('data', async (data) => {
        console.log("__READING RECORD: ", JSON.stringify(data))

        console.log(process.env.SQS_URL);
        await sqs
          .sendMessage({
            MessageBody: JSON.stringify(data),
            QueueUrl: process.env.SQS_URL,
          })
          .promise();

        // await s3.copyObject({
        //   Bucket: bucketName,
        //   CopySource: `${bucketName}/${key}`,
        //   Key: newObjectName,
        // }).promise();

        await s3.deleteObject({
          Bucket: bucketName,
          Key: key,
        }).promise();

        console.log("__OBJECT MOVED TO 'PARSED' FOLDER: ", newObjectName);
      })
      .on('error', (e) => {
        console.log("__ERROR READING RECORD: ", JSON.stringify(e))
      })
      .on('end', (error) => {
        console.log("__ERROR: ", error)
      })
  





  // try {
  //   const signedUrl = s3.getSignedUrl('putObject', params);
  //   return formatJSONResponse({ signedUrl });
  // } catch (e) {
  //   console.log("__ERROR: ", e);
  //   return formatErrorJSONResponse(e, 500);
  // }
};

export const main = importFileParser;

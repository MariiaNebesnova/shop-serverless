import * as AWS from 'aws-sdk';
import csv from 'csv-parser';

import { S3Event } from 'aws-lambda';

const importFileParser = async (event: S3Event) => {
  console.log("__EVENT:  ", JSON.stringify(event))

  const bucketName = 'shop-react-3-files';
  const s3 = new AWS.S3({
    region: 'us-east-1',
  });

  for (const record of event.Records) {
    const key = record.s3.object.key;

    console.log("__OBJECT: ", key)

    const params = {
      Bucket: bucketName,
      Key: decodeURIComponent(record.s3.object.key.replace(/\+/g, '')),
    };

    s3.getObject(params).createReadStream()
      .pipe(csv())
      .on('data', async (data) => {
        console.log("__READING RECORD: ", JSON.stringify(data))

        const newObjectName = key.replace('uploaded', 'parsed');

        await s3.copyObject({
          Bucket: bucketName,
          CopySource: `${bucketName}/${key}`,
          Key: newObjectName,
        }).promise();

        await s3.deleteObject({
          Bucket: bucketName,
          Key: key,
        }).promise();

        console.log("__OBJECT MOVED TO 'PARSED' FOLDER: ", newObjectName);
      })
      .on('error', (e) => {
        console.log("__ERROR READING RECORD: ", JSON.stringify(e))
      })
      .on('end', () => {
        console.log("__READING ")
      })
  }





  // try {
  //   const signedUrl = s3.getSignedUrl('putObject', params);
  //   return formatJSONResponse({ signedUrl });
  // } catch (e) {
  //   console.log("__ERROR: ", e);
  //   return formatErrorJSONResponse(e, 500);
  // }
};

export const main = importFileParser;

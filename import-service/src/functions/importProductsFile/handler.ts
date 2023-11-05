import { ValidatedEventAPIGatewayProxyEvent, formatErrorJSONResponse } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import * as AWS from 'aws-sdk';

import schema from './schema';

const importProductsFile : ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  console.log("__EVENT:  ", JSON.stringify(event, null, 2))

  const fileName = event.queryStringParameters.name;

  if (!fileName) return formatErrorJSONResponse('Invalid filename');

  const s3 = new AWS.S3({
    region: 'us-east-1',
    signatureVersion: 'v4'
  });

  const params = {
    Bucket: 'shop-react-3-files',
    Key: `uploaded/${fileName}`,
    ContentType: 'text/csv',
  };

  try {
    console.log("__PARAMS: ", params);
    const signedUrl = await s3.getSignedUrlPromise('putObject', params);
    console.log("__SignedUrl: ", signedUrl);
    return formatJSONResponse(signedUrl);
  } catch (e) {
    console.log("__ERROR: ", e);
    return formatErrorJSONResponse(e, 500);
  }
};

export const main = middyfy(importProductsFile );

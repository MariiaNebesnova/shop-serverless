import { createtTransactionObjects, productCreateValidationSchema } from '@functions/createProduct/handler';
// import { middyfy } from '@libs/lambda';
import middy from '@middy/core';
import { SQSEvent } from 'aws-lambda';

import * as AWS from 'aws-sdk';

// const ProductsTable = process.env.TABLE_PRODUCTS_NAME;
// const StocksTable = process.env.TABLE_STOCKS_NAME;

const catalogBatchProcess = async (event: SQSEvent) => {
  const sns = new AWS.SNS();
  const dynamo = new AWS.DynamoDB.DocumentClient();

  console.log("__EVENT: ", event);

  for (const message of event.Records) {
    try {
      console.log("__NEW MESSAGE: ", message.body);
      const newProduct = JSON.parse(message.body);
      try {
        await productCreateValidationSchema.validate(newProduct);
      } catch (validationError) {
        console.error('__VALIDATION ERROR: ', validationError.errors);
      }
      
      const { product, transactParams } = createtTransactionObjects(newProduct);
      await dynamo.transactWrite(transactParams).promise();
      const snsMessage = {
        TopicArn: process.env.SNS_TOPIC_ARN,
        Message: `New product created: ${JSON.stringify(product)}`,
        Subject: 'New Product Created',
        MessageAttributes: {
          priceType: {
            DataType: 'String',
            StringValue:
            product.price > 1000 ? 'lux' : 'mass',
          },
        },
      };
      await sns.publish(snsMessage).promise();
    } catch (error) {
      console.error('__UNHANDLED ERROR: ', error);
    }
  }
};

export const main = middy(catalogBatchProcess);

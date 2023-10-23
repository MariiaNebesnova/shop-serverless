import { formatErrorJSONResponse, formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';

import * as AWS from 'aws-sdk';

const ProductsTable = process.env.TABLE_PRODUCTS_NAME;
const StocksTable = process.env.TABLE_STOCKS_NAME;

const dynamo = new AWS.DynamoDB.DocumentClient();

const product = async (event) => {
  console.log("__lambda event", event);

  const id = event.pathParameters.id;
  const params = { 
    TableName: ProductsTable,
    KeyConditionExpression : 'id = :id',
    ExpressionAttributeValues: { ':id': id }
  };

  const stockParams = { 
    TableName: StocksTable,
    KeyConditionExpression : 'product_id = :id',
    ExpressionAttributeValues: { ':id': id }
  };

  try {
    const stocksResponse = await dynamo.query(stockParams).promise();
    console.log(stocksResponse);

    const response = await dynamo.query(params).promise();
    return formatJSONResponse({...response.Items, count: stocksResponse.Items[0].count });
  } catch (error) {
    console.error('Error executing getProductsList:', error);
    return formatErrorJSONResponse(error);
  }
};

export const main = middyfy(product);

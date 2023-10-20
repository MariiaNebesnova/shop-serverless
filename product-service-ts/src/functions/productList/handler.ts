import { formatErrorJSONResponse, formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import * as AWS from 'aws-sdk';

const ProductsTable = process.env.TABLE_PRODUCTS_NAME;
const StocksTable = process.env.TABLE_STOCKS_NAME;

const dynamo = new AWS.DynamoDB.DocumentClient();

const productList = async (event) => {
  console.log("__lambda event", event);

  try {
    const stocksResponse = await dynamo.scan({ TableName: StocksTable }).promise();
    const productsResponse = await dynamo.scan({ TableName: ProductsTable }).promise();

    const result = productsResponse.Items.map((p) => ({
      ...p,
      count: stocksResponse.Items.find((s) => s.product_id === p.id).count,
    }));

    return formatJSONResponse(result);
  } catch (error) {
    console.error('Error executing getProductsList:', error);
    return formatErrorJSONResponse(error);
  }
};

export const main = middyfy(productList);

import { formatErrorJSONResponse, formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { v4 as uuidv4 } from 'uuid';
import * as yup from 'yup';

import * as AWS from 'aws-sdk';

const dynamo = new AWS.DynamoDB.DocumentClient();

const ProductsTable = process.env.TABLE_PRODUCTS_NAME;
const StocksTable = process.env.TABLE_STOCKS_NAME;

export const productCreateValidationSchema = yup.object().shape({
  title: yup.string().required(),
  price: yup.number().moreThan(0).required(),
  description: yup.string().nullable(),
  count: yup.number().integer().required(),
});

export const createtTransactionObjects = ({ title, description, price, count }) => {
  const product = {
    id: uuidv4(),
    title,
    description,
    price
  };

  const stock = { product_id: product.id, count };

  const transactParams: AWS.DynamoDB.DocumentClient.TransactWriteItemsInput = {
    TransactItems: [
      {
        Put: {
          TableName: ProductsTable,
          Item: {
            ...product,
          },
        },
      },
      {
        Put: {
          TableName: StocksTable,
          Item: {
            ...stock,
          },
        },
      }
    ]
  }

  return {
    product,
    stock,
    transactParams
  }
}

const createProduct = async (event) => {
  console.log("__lambda event", event);
  const { product, transactParams } = createtTransactionObjects(event.body);

  try {
    try {
      await productCreateValidationSchema.validate(event.body);
    } catch (validationError) {
      console.error('Validation error:', validationError.errors);
      return formatErrorJSONResponse(validationError.errors);
    }
    await dynamo.transactWrite(transactParams).promise();
    return formatJSONResponse(product);
  } catch (error) {
    console.error('Error executing createProduct:', error);
    return formatErrorJSONResponse(error);
  }
};

export const main = middyfy(createProduct);

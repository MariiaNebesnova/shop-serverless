import { productById } from '@functions/data/productList';
import { formatErrorJSONResponse, formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';

const product = async (event) => {
  const id = event.pathParameters.id;
  if (!id) return formatErrorJSONResponse("No id passed");
  const product = productById(id);
  if (!product) return formatJSONResponse("Product not found");
  return formatJSONResponse(productById(id));
};

export const main = middyfy(product);

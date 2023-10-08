import { productListData } from '@functions/data/productList';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';

const productList = async (event) => {
  console.log(event)
  return formatJSONResponse(productListData);
};

export const main = middyfy(productList);

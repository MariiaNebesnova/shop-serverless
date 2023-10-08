import type { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from "aws-lambda"
import type { FromSchema } from "json-schema-to-ts";

type ValidatedAPIGatewayProxyEvent<S> = Omit<APIGatewayProxyEvent, 'body'> & { body: FromSchema<S> }
export type ValidatedEventAPIGatewayProxyEvent<S> = Handler<ValidatedAPIGatewayProxyEvent<S>, APIGatewayProxyResult>

export const formatJSONResponse = (response: Record<string, unknown> | any[] | string) => {
  return {
    statusCode: 200,
    body: JSON.stringify(response),    	
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  }
}

export const formatErrorJSONResponse = (response: string) => {
  return {
    statusCode: 400,
    body: JSON.stringify(response),    	
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  }
}

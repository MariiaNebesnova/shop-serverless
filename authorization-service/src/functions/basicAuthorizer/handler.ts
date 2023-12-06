import { middyfy } from '@libs/lambda';

import { APIGatewayAuthorizerResult, APIGatewayRequestAuthorizerEvent } from 'aws-lambda';

const generatePolicy = (principalId, effect, resource) => ({
  principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    }
})

const basicAuthorizer: (event: APIGatewayRequestAuthorizerEvent) => Promise<APIGatewayAuthorizerResult> = async (event) => {
  const userName = process.env.ACCOUNT_LOGIN;
  const password = process.env.PASSWORD;

  console.log("__EVENT: ", event);

  const { headers, methodArn } = event;
  const authorizationHeader = headers.Authorization;

  try {
    if (!authorizationHeader) {
      return generatePolicy("No auth header", "Deny", methodArn);
    }

    const encodedCredentials = authorizationHeader.split(' ')[1];
    const credentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8').split(':');

    const effect = credentials[0] === userName && credentials[1] === password ? "Allow" : "Deny";
    
    return generatePolicy(credentials[0], effect, methodArn);
    
  } catch (error) {
    console.log("__BASIC AUTHORIZER ERROR: ", error);
  }
};

export const main = middyfy(basicAuthorizer);

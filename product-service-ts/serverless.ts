import type { AWS } from '@serverless/typescript';

import productList from '@functions/productList';
import getProductById from '@functions/getProductById';
import createProduct from '@functions/createProduct';
import catalogBatchProcess from '@functions/catalogBatchProcess';

const serverlessConfiguration: AWS = {
  service: 'product-service-ts',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild'],
  useDotenv: true,
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      TABLE_PRODUCTS_NAME: "${env:TABLE_PRODUCTS_NAME}",
      TABLE_STOCKS_NAME: "${env:TABLE_STOCKS_NAME}"
    },
    iam: {
      role: {
        statements: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:Query',
              'dynamodb:Scan',
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:TransactWriteItems',
            ],
            Resource: 'arn:aws:dynamodb:us-east-1:784294038424:table/Stocks',
          },
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:Query',
              'dynamodb:BatchGetItem',
              'dynamodb:Scan',
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:TransactWriteItems',
            ],
            Resource: 'arn:aws:dynamodb:us-east-1:784294038424:table/Products',
          },
          {
            Effect: 'Allow',
            Action: [
              'sqs:ReceiveMessage',
              'sqs:DeleteMessage',
              'sqs:GetQueueAttributes',
            ],
            Resource: [
              {
                'Fn::GetAtt': ['SQSProductQueue', 'Arn'],
              },
            ],
          },
          {
            Effect: 'Allow',
            Action: ['sns:Publish'],
            Resource: [
              {
                Ref: 'CreateProductTopic',
              },
            ],
          },
        ],
      },
    },
  },
  // import the function via paths
  functions: { productList, getProductById, createProduct, catalogBatchProcess },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
  },
  resources: {
    Resources: {
      SQSProductQueue: {
        Type: 'AWS::SQS::Queue',
        Properties: {
          QueueName: 'catalogItemsQueue',
        },
      },
      CreateProductTopic: {
        Type: 'AWS::SNS::Topic',
        Properties: {
          DisplayName: 'Product Creation Topic',
          TopicName: 'createProductTopic',
        },
      },
      EmailSubscriptionBasic: {
        Type: 'AWS::SNS::Subscription',
        Properties: {
          Protocol: 'email',
          TopicArn: {
            Ref: 'CreateProductTopic',
          },
          Endpoint: '${env:DEFAULT_EMAIL}',
          FilterPolicy: {
            priceType: ['mass'],
          },
        },
      },
      EmailSubscriptionLuxury: {
        Type: 'AWS::SNS::Subscription',
        Properties: {
          Protocol: 'email',
          TopicArn: {
            Ref: 'CreateProductTopic',
          },
          Endpoint: '${env:SECONDARY_EMAIL}',
          FilterPolicy: {
            priceType: ['lux'],
          },
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;

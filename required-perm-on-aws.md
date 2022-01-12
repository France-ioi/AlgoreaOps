# Required permissions for managing the Algorea Platform 2022 on AWS

As it is very complex to create fine grain controls on AWS services, I suggest to mainly restrict access ressources already used by other FranceIOI services. The goal here is not to let the user do the most restrictive actions (as it should for actual permission restrictions), but to prevent him to view and alter existing sensitive data.

The recommended way to configure such a permisssion set is to create a role (let's call it 'AlgoreaAdmin') and let some users to take this role.

## AWS Certificate Manager

The admin needs to be able to certificates in any region so that Cloudfront, ALB, ... can use them for HTTPS.

Suggested policy statement:
```
        {
            "Effect": "Allow",
            "Action": "acm:*",
            "Resource": "*"
        }
```

## Cloudfront

The admin needs to be able to create and manage the CF distribution which serves the platform assets.

Suggested policy statement:
```
        {
            "Effect": "Allow",
            "Action": "cloudfront:*",
            "Resource": "*"
        }
```

## S3

The admin needs to be able to list all buckets (assuming it is not an issue to see a bucket name) and to manage everything for some of them:
- `algorea-main-static`: static files for the main prod deployment (main served by cloudfront)
- `algorea-logs`: automated logs from services and apps
- `algorea-ops`: files which needs to be stored for ops

In order to allow future other usage, I suggest to allow creating/managing all buckets starting with `algorea-`.

Suggested policy statement:
```
[
    {
      "Effect": "Allow",
      "Action": "s3:ListAllMyBuckets",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::algorea-*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::algorea-*/*"
    }
  ]
```

## RDS

As Algorea requires MySQL 8 which is not used by other applications (from what I know), a new DB instance needs to be run. For now, let us consider the admin needs to fully administration the server.

The following policy assume the admin can view any meta needed to administrate any instance and can create rds-related resource as long as they are related to algorea, so that other DB instances cannot be altered.

(Reference: https://aws.amazon.com/premiumsupport/knowledge-center/rds-iam-least-privileges/)

```
[
        {
            "Effect": "Allow",
            "Action":[
                "ec2:Describe*",
                "rds:Describe*",
                "rds:ListTagsForResource",
                "rds:AddTagsToResource"
            ],
            "Resource": "*"
        },
        {
          "Effect": "Allow",
            "Action": "iam:PassRole",
            "Resource": "arn:aws:iam::*:role/AWSServiceRoleForRDS"
        },
        {
            "Effect": "Allow",
            "Action": [
                "rds:CreateDBParameterGroup",
                "rds:ModifyOptionGroup",
                "rds:CreateOptionGroup",
                "rds:StopDBInstance",
                "rds:CreateDBSubnetGroup",
                "rds:StartDBInstance",
                "rds:DeleteOptionGroup",
                "rds:ModifyDBParameterGroup",
                "rds:CreateDBSnapshot",
                "rds:RestoreDBInstanceFromDBSnapshot",
                "rds:CreateDBInstance",
                "rds:ModifyDBInstance",
                "rds:DeleteDBParameterGroup",
                "rds:RestoreDBInstanceToPointInTime",
                "rds:DeleteDBInstance"
            ],
            "Resource": [
                "arn:aws:rds:*:*:pg:algorea-*",
                "arn:aws:rds:*:*:db:algorea-*",
                "arn:aws:rds:*:*:og:algorea-*",
                "arn:aws:rds:*:*:snapshot:algorea-*",
                "arn:aws:rds:*:*:subgrp:algorea-*",
                "arn:aws:rds:*:*:secgrp:algorea-*"
            ]
        }
    ]
```

## Lambda (+ associated roles)

The admin needs to be able to administrate lambda functions. As lambda is not used for other usage in FranceIOI (as far as I know), let the admin do anything he wants (lambdas cannot access other AWS ressources without specific access roles)

```
[
    {
        "Effect": "Allow",
        "Action": "lambda:*",
        "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole",
        "iam:CreateRole"
      ],
      "Resource": [
        "arn:aws:iam::*:role/Algorea*",
        "arn:aws:iam::*:role/algorea*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "iam:CreatePolicy",
      "Resource": "*"
    },
    {
        "Effect": "Allow",
        "Action": "logs:CreateLogGroup",
        "Resource": "arn:aws:logs:*:*:*"
    },
    {
        "Effect": "Allow",
        "Action": [
            "logs:CreateLogStream",
            "logs:PutLogEvents"
        ],
        "Resource": [
            "arn:aws:logs:*:*:log-group:/aws/lambda/*:*"
        ]
    }
]
```

## ALB

The administrator needs to be able to create an application load balancer and configure in details the listeners (mainly to lambda functions).
As it quite complex to give sufficient permissions to configure all aspects of a LB, we allow everything. This does not allow to view an critical personal information. The risk is to alter another LB by mistake

```
        {
            "Effect": "Allow",
            "Action": "elasticloadbalancing:*",
            "Resource": "*"
        }
```

## Cloudwatch

Let the admin managers all log groups generated by lambdas and by RDS instance starting with "algorea-*".

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:DescribeQueries",
                "logs:GetLogRecord",
                "logs:PutDestinationPolicy",
                "logs:StopQuery",
                "logs:TestMetricFilter",
                "logs:DeleteDestination",
                "logs:DeleteQueryDefinition",
                "logs:PutQueryDefinition",
                "logs:GetLogDelivery",
                "logs:ListLogDeliveries",
                "logs:CreateLogDelivery",
                "logs:DeleteResourcePolicy",
                "logs:PutResourcePolicy",
                "logs:DescribeExportTasks",
                "logs:GetQueryResults",
                "logs:UpdateLogDelivery",
                "logs:CancelExportTask",
                "logs:DeleteLogDelivery",
                "logs:DescribeQueryDefinitions",
                "logs:PutDestination",
                "logs:DescribeResourcePolicies",
                "logs:DescribeDestinations"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": "logs:*",
            "Resource": [
                "arn:aws:logs:*:*:log-group:/aws/lambda/*:log-stream:*",
                "arn:aws:logs:*:*:log-group:/aws/rds/instance/algorea-*:log-stream:*",
                "arn:aws:logs:*:269646813173:destination:*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": "logs:*",
            "Resource": [
                "arn:aws:logs:*:*:log-group:/aws/lambda/*",
                "arn:aws:logs:*:*:log-group:/aws/rds/instance/algorea-*"
            ]
        }
    ]
}
```

### The resulting policy

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "logs:GetLogRecord",
                "logs:GetLogDelivery",
                "logs:ListLogDeliveries",
                "logs:DeleteResourcePolicy",
                "cloudfront:*",
                "rds:Describe*",
                "logs:CancelExportTask",
                "logs:DeleteLogDelivery",
                "logs:DescribeQueryDefinitions",
                "logs:PutDestination",
                "logs:DescribeResourcePolicies",
                "logs:DescribeDestinations",
                "logs:DescribeQueries",
                "rds:AddTagsToResource",
                "logs:PutDestinationPolicy",
                "logs:StopQuery",
                "logs:TestMetricFilter",
                "elasticloadbalancing:*",
                "logs:DeleteDestination",
                "logs:DeleteQueryDefinition",
                "logs:PutQueryDefinition",
                "iam:CreatePolicy",
                "logs:CreateLogDelivery",
                "ec2:Describe*",
                "logs:PutResourcePolicy",
                "logs:DescribeExportTasks",
                "s3:ListAllMyBuckets",
                "logs:GetQueryResults",
                "rds:ListTagsForResource",
                "logs:UpdateLogDelivery",
                "lambda:*",
                "acm:*"
            ],
            "Resource": "*"
        },
        {
            "Sid": "VisualEditor1",
            "Effect": "Allow",
            "Action": [
                "rds:CreateDBParameterGroup",
                "rds:ModifyOptionGroup",
                "rds:CreateOptionGroup",
                "rds:StopDBInstance",
                "rds:CreateDBSubnetGroup",
                "logs:CreateLogGroup",
                "rds:StartDBInstance",
                "rds:DeleteOptionGroup",
                "rds:ModifyDBParameterGroup",
                "iam:PassRole",
                "rds:CreateDBSnapshot",
                "rds:RestoreDBInstanceFromDBSnapshot",
                "rds:CreateDBInstance",
                "rds:ModifyDBInstance",
                "rds:DeleteDBParameterGroup",
                "rds:RestoreDBInstanceToPointInTime",
                "rds:DeleteDBInstance"
            ],
            "Resource": [
                "arn:aws:rds:*:*:pg:algorea-*",
                "arn:aws:rds:*:*:db:algorea-*",
                "arn:aws:rds:*:*:og:algorea-*",
                "arn:aws:rds:*:*:snapshot:algorea-*",
                "arn:aws:rds:*:*:subgrp:algorea-*",
                "arn:aws:rds:*:*:secgrp:algorea-*",
                "arn:aws:iam::*:role/AWSServiceRoleForRDS",
                "arn:aws:logs:*:*:*"
            ]
        },
        {
            "Sid": "VisualEditor2",
            "Effect": "Allow",
            "Action": [
                "iam:PassRole",
                "logs:CreateLogStream",
                "iam:CreateRole",
                "logs:PutLogEvents"
            ],
            "Resource": [
                "arn:aws:iam::*:role/Algorea*",
                "arn:aws:iam::*:role/algorea*",
                "arn:aws:logs:*:*:log-group:/aws/lambda/*:*"
            ]
        },
        {
            "Sid": "VisualEditor3",
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": "arn:aws:s3:::algorea-*"
        },
        {
            "Sid": "VisualEditor4",
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": "arn:aws:s3:::algorea-*/*"
        },
        {
            "Sid": "VisualEditor5",
            "Effect": "Allow",
            "Action": "logs:*",
            "Resource": [
                "arn:aws:logs:*:*:log-group:/aws/lambda/*:log-stream:*",
                "arn:aws:logs:*:*:log-group:/aws/rds/instance/algorea-*:log-stream:*",
                "arn:aws:logs:*:269646813173:destination:*"
            ]
        },
        {
            "Sid": "VisualEditor6",
            "Effect": "Allow",
            "Action": "logs:*",
            "Resource": [
                "arn:aws:logs:*:*:log-group:/aws/lambda/*",
                "arn:aws:logs:*:*:log-group:/aws/rds/instance/algorea-*"
            ]
        }
    ]
}
```

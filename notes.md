Few notes on using ALB (10/2021):
- the first rule "Path is */en/ or */fr/" is required, otherwise for branches, the "/branch/*/" rule matches /branch/*/en/ and so add "/en" in loop.
- the way to make lambda connect with ALB without getting a 502 error (by adding it in ALB target group) is to enable "Multi value headers" in the target group.

OUTDATED

# SSL/Domain

Create the new certificate in the same region as ALB.
Ask to add the certificate TXT and the CNAME to ALB.

## The new DB

As super admin, so

```
mysql -h algorea-dev.cvtiqnzqx0en.eu-central-1.rds.amazonaws.com -u admin --protocol=TCP  algorea_full -p
```

create the user and the db:
create user 'algorea-opentezos'@'%' IDENTIFIED BY '...';
create database algorea_opentezos;
GRANT ALL PRIVILEGES ON algorea_opentezos.* TO 'algorea-opentezos'@'%';

Dump the current db schema:
mysqldump --no-data --triggers --routines --events --add-drop-trigger --no-create-info --no-create-db --skip-opt -h algorea-dev.cvtiqnzqx0en.eu-central-1.rds.amazonaws.com -u algorea-dbadmin --protocol=TCP  algorea_full -p > db-schema-dump-oct21.sql

search and replace "algorea-dbadmin" as trigger definer, to "algorea-opentezos"
apply: mysql -h algorea-dev.cvtiqnzqx0en.eu-central-1.rds.amazonaws.com -u algorea-opentezos --protocol=TCP  algorea_opentezos -p < db-schema-dump-oct21.sql

insert the default groups:
`insert into `groups` (id, name, type, description, is_open, is_public, frozen_membership) values (2, 'TempUsers', 'Base', 'temporary users', 0, 0, 1);`
`insert into `groups` (id, name, type, description, is_open, is_public, frozen_membership) values (3, 'AllUsers', 'Base', 'AllUsers', 0, 0, 1);`

insert into languages values ('en', 'English'), ('fr', 'French');
SET FOREIGN_KEY_CHECKS=0;
create the initial item:
insert into items (id, type, default_language_tag) values (1, 'Chapter', 'en');
SET FOREIGN_KEY_CHECKS=1;
insert into items_strings (item_id, language_tag, title) values (1, 'en', 'Root chapter (rename me)');

update `groups` set root_activity_id = 1 where id IN (2, 3);

insert into `groups` (id, name, type, is_open, is_public, frozen_membership) values (5, 'Platform admins', 'Other', 0, 0, 0);

insert into permissions_granted (group_id, item_id, source_group_id, origin, can_view,  can_grant_view, can_watch, can_edit, is_owner) values (5, 1, 5, 'group_membership', 'solution', 'solution_with_grant', 'answer_with_grant', 'all_with_grant', 1) ;

insert into group_managers (group_id, manager_id , can_manage, can_grant_group_access , can_watch_members) values (3, 5, 'memberships_and_group', 1, 1);

insert into permissions_granted (group_id, item_id, source_group_id, origin, can_view) values (2, 1, 2, 'group_membership', 'content') ;
insert into permissions_granted (group_id, item_id, source_group_id, origin, can_view) values (3, 1, 3, 'group_membership', 'content') ;

`make db-recompute` sur le backend

# The frontend

In the config, change `apiUrl`, `itemPlatformId`, `oauthClientId` and `defaultActivityId`, `title` and `languageSpecificTitles`.

Compile for prod: (one lang at a time as the build override the other)

## en

`ng build --configuration production-en --base-href / --deploy-url //assets.algorea.org/deployments/opentezos/en/ `

aws s3 sync ./dist/algorea/ s3://algorea-static/deployments/opentezos --acl public-read --exclude "*/index.html" --cache-control 'max-age=86400'  --profile franceioi-dev

aws s3 cp ./dist/algorea/en/index.html s3://algorea-static/deployments/opentezos/en/index.html --acl public-read --cache-control 'max-age=300'  --profile franceioi-dev

## fr

`ng build --configuration production-fr --base-href / --deploy-url //assets.algorea.org/deployments/opentezos/fr/ `

aws s3 sync ./dist/algorea/ s3://algorea-static/deployments/opentezos --acl public-read --exclude "*/index.html" --cache-control 'max-age=86400'  --profile franceioi-dev

aws s3 cp ./dist/algorea/fr/index.html s3://algorea-static/deployments/opentezos/fr/index.html --acl public-read --cache-control 'max-age=300'  --profile franceioi-dev

# en+fr

`ng build --configuration production-en --base-href / --deploy-url //assets.algorea.org/deployments/opentezos/en/ && aws s3 sync ./dist/algorea/ s3://algorea-static/deployments/opentezos --acl public-read --exclude "*/index.html" --cache-control 'max-age=86400' --profile franceioi-dev && aws s3 cp ./dist/algorea/en/index.html s3://algorea-static/deployments/opentezos/en/index.html --acl public-read --cache-control 'max-age=300'  --profile franceioi-dev && ng build --configuration production-fr --base-href / --deploy-url //assets.algorea.org/deployments/opentezos/fr/ && aws s3 sync ./dist/algorea/ s3://algorea-static/deployments/opentezos --acl public-read --exclude "*/index.html" --cache-control 'max-age=86400'  --profile franceioi-dev && aws s3 cp ./dist/algorea/fr/index.html s3://algorea-static/deployments/opentezos/fr/index.html --acl public-read --cache-control 'max-age=300'  --profile franceioi-dev`

## root

Generate the root index.html file (see CI)

aws s3 cp ./dist/algorea/index.html s3://algorea-static/deployments/opentezos/index.html --acl public-read --cache-control 'max-age=300'  --profile franceioi-dev


# AWS lambda & ALB

For static and backend: change the config, save to a new version, update/create the alias, restore the initial config.

Config to change for the backend: ALGOREA_AUTH__CLIENTID, ALGOREA_AUTH__CLIENTSECRET, ALGOREA_DATABASE__DBNAME, ALGOREA_DATABASE__PASSWD, ALGOREA_DATABASE__USER, ALGOREA_SERVER__DOMAINOVERRIDE

In EC2, create a new target rule for the lambda alias, enable multi-header on the backend target
In EC2/ALB, copy the other rules to match the hosts.
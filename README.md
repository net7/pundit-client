# PUNDIT

Pundit is a tool useful for creating annotations on the web. This repository hosts the code of
Pundit's client.

The client is built upon Typescript, Angular, and N7's front-end framework. It can be used both as a
Chrome Extension, or in an embedded environment.

## Production files update for WP plugin

Preface: this command is valid if before you have properly configure an AWS stack based on s3+cloudfront
You also need aws-cli command line available on your laptop. You can find more info about it here:
https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html

Launch command `sh push-prod.sh`
This commands needs three parameters:

- the first is the branch that you want to deploy on s3
- the second and the third are the keys needed by AWS to authenticate the operations (you can find this infos on 1password, the card is named Pundit-AWS).

So, the command to be launched is something like this:
./push-prod.sh <branch> <aws_key> <aws_secret>

## Structure

Pundit as a service is divided in a couple repositories:

- Pundit client (that you are currently viewing)
- Pundit communication
  - this is where the networking is handled, and provides an api for the client to get annotations
- Pundit annotation
  - this repo hosts the annotation logic, this manages how each annotation is anchored to the web page

## Development

To make some changes to the client, clone this repository and run `npm install`.
You can then run the command `npm run start` to build the client and serve a locally hosted version.

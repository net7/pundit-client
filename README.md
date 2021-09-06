# Pundit Annotator

Pundit is a tool useful for creating annotations on the web. repository hosts the code of
Pundit's client.

The client is built upon Typescript, Angular, and N7's front-end framework. It can be used both as a
Chrome Extension, or in an embedded environment.

The app is built using the shadow-root in order to maximize the compatibility with external websites and applications.

## Structure

Pundit as a service is divided in a couple repositories:

- Pundit Client (that you are currently viewing)
- [Pundit Communication](https://github.com/net7/pundit-communication)
  - this is where the networking is handled, and provides an api for the client to get annotations
- [Pundit Anchoring](https://github.com/net7/pundit-anchoring)
  - this repo hosts the anchoring logic, this manages how each annotation is anchored to the web page

In this repository you will find:
- **app**: the main folder where the majority of the client's code is located. For a detailed view of the app folder, [refer to the readme document in src/app](./src/app/README.md).
- **chrome-ext**: files included only when building the client for the chrome extension / web-store.
- **common**: this folder contains the shared files that are compiled both into the chrome extension and into the embedded versions.
- **environments**: files with the parameters needed to build each of the various environments (chrome-ext prod/stage, embedded prod/stage, local)
- **html-examples**: contains the html code for mockup web-pages where you can view the client locally for testing purposes.
- **styles**: contains all of the css for the project, written in SCSS.

## Development

### Pre-requirements

- Git
- NodeJS version v.12+
- Angular CLI v.9+ (optional)

### Building the client

To build the client locally, clone this repository and cd into the cloned folder, then run `npm install`.
You can then run the command `npm run start` to serve the application on http://localhost:4200/

## Production files update for WP plugin

Preface: this command is valid if before you have properly configure an AWS stack based on s3+cloudfront
You also need aws-cli command line available on your laptop. You can find more info about it here:
https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html

Launch the command: `sh push-prod.sh`
This commands needs three parameters:

- the first is the branch that you want to deploy on s3
- the second and the third are the keys needed by AWS to authenticate the operations (you can find this infos on 1password, the card is named Pundit-AWS).

So, the command to be launched is something like this:
./push-prod.sh <branch> <aws_key> <aws_secret>

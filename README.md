# PUNDIT

Pundit is a tool useful for creating annotations on the web. This repository hosts the code of
Pundit's client.

The client is built upon Typescript, Angular, and N7's front-end framework. It can be used both as a
Chrome Extension, or in an embedded environment.

## Production files update for WP plugin

Launch command `sh push-prod.sh`
...parameters...

## Structure

Pundit as a service is divided in a couple repositories:

-   Pundit client (that you are currently viewing)
-   Pundit communication
    -   this is where the networking is handled, and provides an api for the client to get annotations
-   Pundit annotation
    -   this repo hosts the annotation logic, this manages how each annotation is anchored to the web page

## Development

To make some changes to the client, clone this repository and run `npm install`.  
You can then run the command `npm run start` to build the client and serve a locally hosted version.


#!/bin/sh
rm -fr node_modules
rm -fr package-lock.json
#Update repo
git pull origin $1
#install dependencies
npm install
#build
npm run build:embed-stage
#push dist on s3
export AWS_ACCESS_KEY_ID=$2; export AWS_SECRET_ACCESS_KEY=$3;
mkdir dist/fonts;cd dist/fonts/; git clone git@github.com:net7/pundit-icon-font.git
aws s3 sync --acl public-read  --region='eu-south-1' pundit-icon-font/font/pundit-icon-font s3://static-pundit/pundit-icon-font
cd ../..;
aws s3 sync --acl public-read  --region='eu-south-1' dist/embed-stage s3://static-pundit/releases/stage/
rm -fr dist/fonts
aws cloudfront create-invalidation --distribution-id E3JMMV8C3EZFVD --paths "/*"

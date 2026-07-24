#!/bin/bash
set -euo pipefail

# Deploy embed + pdf-viewer standalone su S3 e invalidazione CloudFront.
#
# Uso: ./deploy.sh stage|prod
#
# Richiede credenziali AWS nell'ambiente (AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY
# oppure AWS_PROFILE). Non committare mai credenziali in questo file.

ENV="${1:-}"
case "$ENV" in
  stage)
    EMBED_DIST="dist/embed-stage"
    PDF_DIST="dist/pdf-standalone-stage"
    EMBED_S3="s3://static-pundit/releases/stage"
    PDF_S3="s3://static-pundit/releases/stage/pdf-viewer"
    INVALIDATION_PATHS="/releases/stage/*"
    ;;
  prod)
    EMBED_DIST="dist/embed-prod"
    PDF_DIST="dist/pdf-standalone-prod"
    EMBED_S3="s3://static-pundit/releases"
    PDF_S3="s3://static-pundit/releases/pdf-viewer"
    INVALIDATION_PATHS="/releases/*"
    ;;
  *)
    echo "Uso: $0 stage|prod" >&2
    exit 1
    ;;
esac

export AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-eu-south-1}"
DISTRIBUTION_ID="E3JMMV8C3EZFVD"

if ! aws sts get-caller-identity > /dev/null 2>&1; then
  echo "Credenziali AWS mancanti o non valide (env var o AWS_PROFILE)" >&2
  exit 1
fi

npm run "build:embed-$ENV"
npm run "build:pdf-standalone-$ENV"

# Niente --delete: releases/ contiene anche stage/ e pdf-viewer/, un sync
# distruttivo dell'embed prod cancellerebbe gli altri deploy.
aws s3 sync --acl public-read "$EMBED_DIST/" "$EMBED_S3"
aws s3 sync --acl public-read "$PDF_DIST/" "$PDF_S3"

aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "$INVALIDATION_PATHS"

echo "Deploy $ENV completato."

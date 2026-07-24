#!/bin/bash
set -euo pipefail

# Deploy embed su S3 e invalidazione CloudFront.
#
# Uso: ./deploy.sh stage|prod
#
# Richiede credenziali AWS nell'ambiente (AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY
# oppure AWS_PROFILE). Non committare mai credenziali in questo file.

ENV="${1:-}"
case "$ENV" in
  stage)
    EMBED_DIST="dist/embed-stage"
    EMBED_S3="s3://static-pundit/releases/stage"
    INVALIDATION_PATHS="/releases/stage/*"
    ;;
  prod)
    EMBED_DIST="dist/embed-prod"
    EMBED_S3="s3://static-pundit/releases"
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
npm install
npm run "build:embed-$ENV"

# Niente --delete: releases/ contiene anche stage/, un sync distruttivo
# dell'embed prod cancellerebbe il deploy di stage.
aws s3 sync --acl public-read "$EMBED_DIST/" "$EMBED_S3"

aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "$INVALIDATION_PATHS"

echo "Deploy $ENV completato."

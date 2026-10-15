#!/bin/bash
set -euo pipefail

# Build dentro Docker, senza node/npm sull'host.
#
# Uso: scripts/build.sh <target>[,<target>...] stage|prod <outdir>
#
#   ext    estensione Chrome (build:chrome-ext-<env>, compila anche l'embed)
#   embed  embed (build:embed-<env>)
#   pdf    pdf viewer standalone (build:pdf-standalone-<env>)
#
# Esempio: scripts/build.sh ext,pdf stage ../out
#
# Esegue `npm ci` + i build richiesti e copia le cartelle dist/<config>
# corrispondenti in <outdir>. node_modules e cache npm stanno in volumi Docker:
# quelli dell'host non vengono toccati.

usage() {
  echo "Uso: $0 ext|embed|pdf[,...] stage|prod <outdir>" >&2
  exit 1
}

[ $# -eq 3 ] || usage
TARGETS="$1"
ENV="$2"
OUTDIR="$3"

case "$ENV" in
  stage|prod) ;;
  *) usage ;;
esac

for t in ${TARGETS//,/ }; do
  case "$t" in
    ext|embed|pdf) ;;
    *) usage ;;
  esac
done

has() { [[ ",$TARGETS," == *",$1,"* ]]; }

SCRIPTS=""
DIRS=""
if has ext; then
  SCRIPTS+=" build:chrome-ext-$ENV"
  DIRS+=" chrome-ext-$ENV"
fi
if has embed; then
  # il build ext compila gia' l'embed
  has ext || SCRIPTS+=" build:embed-$ENV"
  DIRS+=" embed-$ENV"
fi
if has pdf; then
  SCRIPTS+=" build:pdf-standalone-$ENV"
  DIRS+=" pdf-standalone-$ENV"
fi
[ -n "$DIRS" ] || usage

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ ! -f "$ROOT/src/environments/local.$ENV.ts" ]; then
  echo "Manca src/environments/local.$ENV.ts (vedi README, generalo con pundit-deployment/scripts/render-env.sh)" >&2
  exit 1
fi

command -v docker >/dev/null 2>&1 || { echo "docker non trovato" >&2; exit 1; }

NODE_VERSION="$(tr -d 'v[:space:]' < "$ROOT/.node-version")"

mkdir -p "$OUTDIR"
OUTDIR="$(cd "$OUTDIR" && pwd)"

# Il container gira come root: fix_owner riassegna i file prodotti all'utente
# host anche se il build fallisce.
# La dipendenza git+ssh (@pundit/icon-font) e' un repo pubblico: nel container
# la si scarica via https, cosi' non servono chiavi SSH.
BUILD_CMD='
set -e
fix_owner() {
  chown -R "$HOST_UID:$HOST_GID" dist .angular 2>/dev/null || true
  for d in $DIRS; do chown -R "$HOST_UID:$HOST_GID" "/out/$d" 2>/dev/null || true; done
}
trap fix_owner EXIT
export NG_CLI_ANALYTICS=false
git config --global url."https://github.com/".insteadOf "ssh://git@github.com/"
git config --global --add url."https://github.com/".insteadOf "git@github.com:"
npm install -g --no-fund --no-audit "$(node -p "require(\"./package.json\").packageManager")"
npm ci --no-fund --no-audit
for s in $SCRIPTS; do npm run "$s"; done
for d in $DIRS; do
  rm -rf "/out/$d"
  cp -R "dist/$d" /out/
done
'

docker run -t --rm \
  -u 0 \
  -e SCRIPTS="$SCRIPTS" \
  -e DIRS="$DIRS" \
  -e HOST_UID="$(id -u)" \
  -e HOST_GID="$(id -g)" \
  -v "$ROOT":/app \
  -v pundit-client-node-modules:/app/node_modules \
  -v pundit-client-npm-cache:/root/.npm \
  -v "$OUTDIR":/out \
  -w /app \
  "node:$NODE_VERSION" \
  sh -c "$BUILD_CMD"

echo "Build $ENV pronto in $OUTDIR:$DIRS"

#!/bin/bash
set -e

rm -rf ./dist

TAG=$(git log -1 --pretty=%h)
LATEST="latest"
ORG="deipworld"
IMAGE_PREFIX="$1"
DW_API_URL="$2"
DW_SENTRY="$3"
DW_NETWORK="$4"
DW_RELEASE=$(git show -s --format=%H)

echo "Building $ORG/$IMAGE_PREFIX-web-wallet image..."
export IMAGE_NAME="$ORG/$IMAGE_PREFIX-web-wallet:$TAG"
export LATEST_IMAGE_NAME="$ORG/$IMAGE_PREFIX-web-wallet:$LATEST"
docker build --build-arg DW_API_URL=${DW_API_URL} --build-arg DW_SENTRY=${DW_SENTRY} --build-arg DW_RELEASE=${DW_RELEASE} --build-arg DW_NETWORK=${DW_NETWORK} -t="${IMAGE_NAME}" -f=Dockerfile.stage .
docker tag ${IMAGE_NAME} ${LATEST_IMAGE_NAME}
docker push ${IMAGE_NAME}
docker push ${LATEST_IMAGE_NAME}
docker rmi ${IMAGE_NAME}
docker rmi ${LATEST_IMAGE_NAME}


# ./build-docker.sh "deip" "https://demo.wallet.webserver.casimir.one" "https://78783252fab34a6097e4016782548800@o1270391.ingest.sentry.io/6465321" "wss://demo.appchain.ws.casimir.one"
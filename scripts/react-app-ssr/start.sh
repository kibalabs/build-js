#!/usr/bin/env bash
set -e -o pipefail

export KRT_NAME=$SERVICE_NAME
export KRT_VERSION=$VERSION

for assignment in $(env | grep "^KRT_"); do
  IFS='=' read -r name value <<< "$(echo -e "$assignment" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
  echo "GLOBAL.$name = \"$value\";" >> ./dist/runtimeConfig.js
done

exec node ./dist/index.js

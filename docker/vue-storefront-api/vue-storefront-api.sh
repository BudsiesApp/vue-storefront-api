#!/bin/sh
set -e

envsubst < config/local.json.example > config/local.json

yarn install || exit $?

if [ "$VS_ENV" = 'dev' ]; then
  yarn dev
else
  yarn start
fi

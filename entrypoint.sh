#!/bin/sh

echo "HI! Writing config.json"

echo "{\"autowmsurl\":\""${ADAGUC_AUTOWMS_ENDPOINT}"\"}" > /usr/share/nginx/html/config.json

exec "$@"
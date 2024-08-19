#!/bin/sh

echo "HI! Writing config.json using ${ADAGUC_AUTOWMS_ENDPOINT}"

echo "{\"autowmsurl\":\""${ADAGUC_AUTOWMS_ENDPOINT}"\"}" > /usr/share/nginx/html/config.json

exec "$@"
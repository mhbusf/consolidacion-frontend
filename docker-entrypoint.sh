#!/bin/sh
set -eu

# Solo sustituimos nuestra variable para no romper variables internas de Nginx.
envsubst '${BACKEND_URL}' < /tmp/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g 'daemon off;'

#!/usr/bin/env sh
set -euo pipefail

# Provide defaults if not set
: "${BACKEND_URL:=http://recipebook-server:8000/}"
: "${S3_URL:=http://recipebook-rustfs:9000/}"

export BACKEND_URL
export S3_URL

# Render template -> default nginx conf
envsubst '\$BACKEND_URL \$S3_URL' \
  < /etc/nginx/templates/nginx.conf.template \
  > /etc/nginx/conf.d/default.conf

# Debugging: Uncomment before building if you want some debugging info (useful for dev)
# echo "=== nginx starting ==="
# echo "proxying /api to backend url: ${BACKEND_URL}"
# echo "proxying /s3 to s3 url: ${S3_URL}"

# echo "value of /etc/nginx/conf.d/default.conf"
# cat /etc/nginx/conf.d/default.conf

echo "Starting Nginx"
echo "After Nginx startup, you should be able to access the webpage at http://localhost:8650"

# Exec nginx in foreground to handle signals properly
exec nginx -g 'daemon off;'
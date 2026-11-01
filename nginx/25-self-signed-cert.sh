#!/bin/sh
# Zažene se ob zagonu nginx vsebnika (mapa /docker-entrypoint.d). Če še ni certifikata, ustvari
# samopodpisanega za razvoj; brskalnik bo ob prvem obisku opozoril, da mu ne zaupa.
# Pravi certifikat (npr. Let's Encrypt) nastavite s spremenljivkama SSL_CERT in SSL_KEY (docs/namestitev.md).
set -e

DEFAULT_DIR=/etc/nginx/certs
if [ "$SSL_CERT" != "$DEFAULT_DIR/fullchain.pem" ]; then
  exit 0
fi

if [ ! -f "$SSL_CERT" ] || [ ! -f "$SSL_KEY" ]; then
  mkdir -p "$DEFAULT_DIR"
  # CERT_SAN: dodatna imena/naslovi, pod katerimi je dostopen strežnik, npr. "DNS:edulink,IP:192.168.1.10".
  SAN="DNS:localhost,IP:127.0.0.1${CERT_SAN:+,$CERT_SAN}"
  echo "25-self-signed-cert: ustvarjam samopodpisan certifikat ($SAN)"
  openssl req -x509 -nodes -newkey rsa:2048 -days 825 \
    -keyout "$SSL_KEY" -out "$SSL_CERT" \
    -subj "/CN=edulink" -addext "subjectAltName=$SAN"
  chmod 600 "$SSL_KEY"
fi

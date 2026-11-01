#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
    echo "Ejecuta este script con sudo en ugelab." >&2
    exit 1
fi

tls_dir=/etc/sfstudio/tls
site=/etc/nginx/sites-available/sfstudio
old_cert=/etc/forja2doc/tls/ugelab.crt
old_key=/etc/forja2doc/tls/ugelab.key
new_cert=$tls_dir/server.crt
new_key=$tls_dir/server.key

if [[ ! -f $site ]]; then
    echo "No existe el virtual host de SF Studio: $site" >&2
    exit 1
fi

install -d -m 0755 "$tls_dir"
if [[ ! -e $tls_dir/ca.key && ! -e $tls_dir/ca.crt && ! -e $new_key && ! -e $new_cert ]]; then
    umask 077
    openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out "$tls_dir/ca.key" >/dev/null 2>&1
    openssl req -new -x509 -sha256 -days 1825 -key "$tls_dir/ca.key" \
        -out "$tls_dir/ca.crt" -subj '/CN=SF Studio ugelab Local CA' \
        -addext 'basicConstraints=critical,CA:TRUE,pathlen:0' \
        -addext 'keyUsage=critical,keyCertSign,cRLSign'
    openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:3072 -out "$new_key" >/dev/null 2>&1
    openssl req -new -key "$new_key" -out "$tls_dir/server.csr" \
        -subj '/CN=sfstudio.ugelab'
    cat > "$tls_dir/server.ext" <<'EOF'
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature,keyEncipherment
extendedKeyUsage=serverAuth
subjectAltName=DNS:sfstudio.ugelab
EOF
    openssl x509 -req -sha256 -days 825 -in "$tls_dir/server.csr" \
        -CA "$tls_dir/ca.crt" -CAkey "$tls_dir/ca.key" -CAcreateserial \
        -out "$new_cert" -extfile "$tls_dir/server.ext"
    rm "$tls_dir/server.csr" "$tls_dir/server.ext"
    chmod 0600 "$tls_dir/ca.key" "$new_key"
    chmod 0644 "$tls_dir/ca.crt" "$new_cert"
elif [[ ! -f $tls_dir/ca.key || ! -f $tls_dir/ca.crt || ! -f $new_key || ! -f $new_cert ]]; then
    echo "El directorio TLS contiene una instalación parcial; revísala antes de repetir." >&2
    exit 1
fi

openssl verify -CAfile "$tls_dir/ca.crt" "$new_cert"
openssl x509 -in "$new_cert" -noout -checkhost sfstudio.ugelab

if grep -Fq "ssl_certificate     $old_cert;" "$site" \
    && grep -Fq "ssl_certificate_key $old_key;" "$site"; then
    backup="$site.bak.$(date -u +%Y%m%dT%H%M%SZ)"
    cp -p "$site" "$backup"
    sed -i "s|$old_cert|$new_cert|; s|$old_key|$new_key|" "$site"
    if ! nginx -t || ! systemctl reload nginx; then
        cp -p "$backup" "$site"
        nginx -t
        systemctl reload nginx
        echo "Se restauró el virtual host anterior." >&2
        exit 1
    fi
elif ! grep -Fq "ssl_certificate     $new_cert;" "$site" \
    || ! grep -Fq "ssl_certificate_key $new_key;" "$site"; then
    echo "El virtual host usa rutas de certificado inesperadas; no se modificó Nginx." >&2
    exit 1
fi

echo "Certificado instalado para sfstudio.ugelab."
echo "Instala $tls_dir/ca.crt en el almacén de CA raíz del usuario de Windows."
openssl x509 -in "$tls_dir/ca.crt" -noout -fingerprint -sha256

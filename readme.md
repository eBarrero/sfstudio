npm init -y
cd api
npm init -y
npm install typescript -D
add  "tsc": "tsc" to scripts
npm run tsc -- --init  (crea el tsconfig.json )
npm install express simple-oauth2 ts-node -E
npm install @types/express  @types/simple-oauth2 -D -E -w api
npm install cookie-parser -E -w api
npm install @types/cookie-parser -D -E -w api
npm install jsforce -E -w api
npm install @types/jsforce -D-E -w api

cd ..
npm intall vita@lasted

crear proxy para vite en ite.config.ts
...
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }


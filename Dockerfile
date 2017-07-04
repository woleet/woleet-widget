FROM nginx:mainline-alpine

WORKDIR /

COPY dist /usr/share/nginx/html/dist
COPY index.html /usr/share/nginx/html/index.html
COPY image /usr/share/nginx/html/image
COPY node_modules/woleet-weblibs /usr/share/nginx/html/node_modules/woleet-weblibs

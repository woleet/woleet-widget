FROM nginx:mainline-alpine

WORKDIR /

COPY dist /usr/share/nginx/html/dist
COPY index.html /usr/share/nginx/html/index.html
COPY bower_components /usr/share/nginx/html/bower_components

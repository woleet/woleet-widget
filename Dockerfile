FROM nginx:mainline-alpine

WORKDIR /

COPY dist /usr/share/nginx/html/
COPY res/index.html /usr/share/nginx/html/index.html
COPY bower_components /usr/share/nginx/html/bower_components

#COPY nginx-ui.conf /etc/nginx/conf.d/default.conf
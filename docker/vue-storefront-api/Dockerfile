FROM node:10-alpine

ENV VS_ENV prod

WORKDIR /var/www

RUN apk add --no-cache curl git

#COPY package.json ./
#COPY yarn.lock ./

RUN apk add --no-cache --virtual .build-deps ca-certificates wget python make g++ && \
    yarn install --no-cache && \
    apk del .build-deps

RUN apk add --update libintl && apk add --virtual build_deps gettext

COPY docker/vue-storefront-api/vue-storefront-api.sh /usr/local/bin/

COPY config /var/www/config

CMD ["vue-storefront-api.sh"]

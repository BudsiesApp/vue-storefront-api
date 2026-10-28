FROM node:14

ENV BIND_HOST=0.0.0.0 OPENSEARCH_HOST=os1 OPENSEARCH_PORT=9200 OPENSEARCH_PROTOCOL=http REDIS_HOST=redis REDIS_PORT=6379 REDIS_DB=0 PM2_ARGS=--no-daemon VS_ENV=prod

WORKDIR /var/www

COPY . .

RUN apt update && apt install -y git \
  && yarn install

COPY dev/docker/vue-storefront-api.sh /usr/local/bin/

ENTRYPOINT ["vue-storefront-api.sh"]

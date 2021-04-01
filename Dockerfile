FROM node:alpine as build
RUN apk add --no-cache --virtual .gyp \
        python \
        make \  
        g++

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN apk del .gyp

CMD [ "npm", "start" ]
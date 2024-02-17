FROM node:20.11.1

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn

RUN yarn add sharp --ignore-engines

COPY . .

RUN yarn build

CMD ["node", "dist/Bot.js"]
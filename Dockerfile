FROM node:20.11.1

RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn

RUN yarn add sharp --ignore-engines

COPY . .

RUN yarn build

CMD ["node", "dist/Bot.js"]
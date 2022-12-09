FROM node:18-alpine3.16
WORKDIR /app/

# install nodejs
RUN apk update && apk add --no-cache nodejs ffmpeg

# copy package information
COPY package.json package.json
COPY package-lock.json package-lock.json

# install dependencies
RUN npm ci

# copy app source
COPY . .

# run the bot!
CMD [ "npm", "run", "start" ]
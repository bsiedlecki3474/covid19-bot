FROM node:14
WORKDIR /usr/src/covid19bot
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 8080
CMD [ "node", "index.js" ]
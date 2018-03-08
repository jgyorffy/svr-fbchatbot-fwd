FROM node_with_java9
ENV NODE_ENV production
WORKDIR /opt/svr-fbchatbot-fwd/app
COPY ["package.json", "./"]
RUN apt-get update && apt-get install -y net-tools
RUN npm install --production --silent && mv node_modules ../
COPY . .
EXPOSE 8080
CMD node app.js
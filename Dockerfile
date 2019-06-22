FROM node:10 as buildimage
EXPOSE 3000

# Copy assets and install dependencies
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install --silent
COPY . ./
CMD ["node", "src/index.js"]

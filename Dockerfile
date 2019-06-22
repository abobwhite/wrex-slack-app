FROM node:10 as buildimage

# Copy assets and install dependencies
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install --silent
COPY . ./

# Build
RUN CI=true npm run build

FROM node:10
EXPOSE 3000
WORKDIR /opt/app
COPY --from=buildimage /usr/src/app/dist ./
CMD ["node", "index.js"]

# Our first stage, that is the Builder
FROM node:16-alpine AS ts-sample-builder
WORKDIR /app
COPY . .
RUN rm -rf dist
RUN npm install
RUN npm run build

# Install production NPM packages separately
FROM node:16-alpine AS npm-packages
WORKDIR /app
COPY package* ./
RUN npm install --production

# Our Second stage, that creates an image for production
FROM node:16-alpine AS ts-sample-prod
VOLUME /app
WORKDIR /app
COPY --from=ts-sample-builder ./app/dist ./dist
COPY package* ./
COPY --from=npm-packages ./app/node_modules ./node_modules
CMD npm start

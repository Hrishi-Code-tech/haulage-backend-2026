FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Expose port 3001
EXPOSE 3001

# Start development server
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3001"]

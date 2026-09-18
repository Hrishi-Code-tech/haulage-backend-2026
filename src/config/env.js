import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 8001,
  DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
};
console.log("ENV LOADED:", ENV);

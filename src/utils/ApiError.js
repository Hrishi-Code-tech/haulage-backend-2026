//This file is essential/its advantages
//as it wil be imported somewhere else and used in catch block prolly
//we use err.data = { field: "username", message: "Username is required" },so we can use it later for debugging which will help us pinpoint the where the error is actually being generated from
//This file is usefull for debugging errors in both development and production

class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null; // placeholder for future use of debugging
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };

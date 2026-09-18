import app from "./app.js";
import { ENV } from "./config/env.js";

const PORT = ENV.PORT;

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
});

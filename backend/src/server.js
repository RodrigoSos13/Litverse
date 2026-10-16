import dotenv from "dotenv";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";

import { prepareCatalog } from "./services/catalogSync.js";

dotenv.config();

const port = process.env.PORT || 5000;

connectDatabase()
  .then(async () => {
    await prepareCatalog();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch(() => {
    process.exit(1);
  });

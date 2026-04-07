import { createDb } from "./db/connection.js";
import { initDb } from "./db/initDb.js";
import { createApp } from "./app.js";

const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || "northstar-dev-secret";

const db = createDb(process.env.DB_PATH || "./northstar.db");
initDb(db);

const app = createApp({ db, jwtSecret: JWT_SECRET });
app.listen(PORT, () => {
  console.log(`Northstar backend listening on port ${PORT}`);
});

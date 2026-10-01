import { getMariaDbPool, initializeMariaDb } from "@mast/database";

initializeMariaDb()
  .then(() => {
    console.log("MariaDB schema and reference data are ready.");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => getMariaDbPool().end());

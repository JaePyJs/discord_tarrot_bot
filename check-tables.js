const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "src", "database", "tarot.db");
console.log("Checking database at:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err);
    return;
  }

  console.log("Successfully connected to database");

  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
      console.error("Error querying tables:", err);
    } else {
      console.log("\nCurrent tables in database:");
      rows.forEach((row) => console.log("- " + row.name));
      console.log(`\nTotal tables: ${rows.length}`);
    }

    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err);
      } else {
        console.log("\nDatabase connection closed.");
      }
    });
  });
});

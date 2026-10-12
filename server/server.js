
import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import { pathToFileURL } from "node:url";


export function createApp(databasePath = process.env.DB_PATH || "expenses.db") {
  const app = express();
  const db = new Database(databasePath);

  app.use(cors());
  app.use(express.json());

  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      amount REAL NOT NULL CHECK (amount > 0),
      category TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const categories = ["Food", "Transport", "Shopping", "Bills", "Other"];

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/expenses", (req, res) => {
    const expenses = db
      .prepare("SELECT * FROM expenses ORDER BY id DESC")
      .all();

    res.json(expenses);
  });

  app.post("/api/expenses", (req, res) => {
    const { description, amount, category } = req.body;

    if (typeof description !== "string" || !description.trim()) {
      return res.status(400).json({
        error: "Description is required.",
      });
    }

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        error: "Amount must be a positive number.",
      });
    }

    if (!categories.includes(category)) {
      return res.status(400).json({
        error: "Invalid category.",
      });
    }

    const result = db
      .prepare(
        `INSERT INTO expenses (description, amount, category)
         VALUES (?, ?, ?)`
      )
      .run(description.trim(), amount, category);

    const expense = db
      .prepare("SELECT * FROM expenses WHERE id = ?")
      .get(result.lastInsertRowid);

    res.status(201).json(expense);
  });

  app.delete("/api/expenses/:id", (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid expense ID.",
      });
    }

    const result = db
      .prepare("DELETE FROM expenses WHERE id = ?")
      .run(id);

    if (result.changes === 0) {
      return res.status(404).json({
        error: "Expense not found.",
      });
    }

    res.status(204).end();
  });

  return { app, db };
}


const isMainModule =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;


if (isMainModule) {
  const { app } = createApp();
  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`Expense API running on port ${PORT}`);
  });
}

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { once } from "node:events";
import { createApp } from "../server.js";

let server;
let db;
let baseUrl;
let tempDir;

before(async () => {
  tempDir = await mkdtemp(path.join(tmpdir(), "expense-tests-"));

  const result = createApp(path.join(tempDir, "test.db"));
  db = result.db;

  server = result.app.listen(0, "127.0.0.1");
  await once(server, "listening");

  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  if (db) db.close();

  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("health endpoint returns OK", async () => {
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("expenses endpoint initially returns an empty list", async () => {
  const response = await fetch(`${baseUrl}/api/expenses`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), []);
});

test("creating an expense trims its description and saves it", async () => {
  const response = await fetch(`${baseUrl}/api/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: "  Lunch  ",
      amount: 150,
      category: "Food",
    }),
  });

  const expense = await response.json();

  assert.equal(response.status, 201);
  assert.equal(expense.description, "Lunch");
  assert.equal(expense.amount, 150);
  assert.equal(expense.category, "Food");
  assert.ok(expense.id);

  const listResponse = await fetch(`${baseUrl}/api/expenses`);
  assert.equal(listResponse.status, 200);

  const expenses = await listResponse.json();

  assert.ok(
    expenses.some(
      (item) =>
        item.id === expense.id &&
        item.description === "Lunch" &&
        item.amount === 150 &&
        item.category === "Food"
    ),
    "Created expense should appear in the expense list"
  );
});

test("rejecting an empty description", async () => {
  const response = await fetch(`${baseUrl}/api/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: "   ",
      amount: 100,
      category: "Food",
    }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Description is required.",
  });
});

test("rejecting a non-positive amount", async () => {
  const response = await fetch(`${baseUrl}/api/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: "Bus fare",
      amount: 0,
      category: "Transport",
    }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Amount must be a positive number.",
  });
});

test("rejecting an invalid category", async () => {
  const response = await fetch(`${baseUrl}/api/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: "Test",
      amount: 50,
      category: "Invalid",
    }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Invalid category.",
  });
});

test("rejecting an invalid expense ID", async () => {
  const response = await fetch(`${baseUrl}/api/expenses/abc`, {
    method: "DELETE",
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: "Invalid expense ID.",
  });
});

test("returning 404 for a missing expense", async () => {
  const response = await fetch(`${baseUrl}/api/expenses/999999`, {
    method: "DELETE",
  });

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    error: "Expense not found.",
  });
});

test("deleting an existing expense removes it", async () => {
  const createResponse = await fetch(`${baseUrl}/api/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      description: "Expense to delete",
      amount: 50,
      category: "Food",
    }),
  });

  assert.equal(createResponse.status, 201);
  const expense = await createResponse.json();

  const deleteResponse = await fetch(
    `${baseUrl}/api/expenses/${expense.id}`,
    { method: "DELETE" }
  );

  assert.equal(deleteResponse.status, 204);

  const listResponse = await fetch(`${baseUrl}/api/expenses`);
  assert.equal(listResponse.status, 200);

  const expenses = await listResponse.json();

  assert.equal(
    expenses.some((item) => item.id === expense.id),
    false,
    "Deleted expense should no longer appear in the list"
  );
});
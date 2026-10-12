# Expense Tracker

A full-stack expense tracking application built with React, Node.js, Express, and SQLite.

## Features

- Add expenses with a description, amount, and category
- View all recorded expenses
- Delete expenses
- Calculate total spending
- View spending totals by category
- Validate expense data in the backend
- Persist expense records using SQLite

## Tech Stack

- Frontend: React, JavaScript, Vite
- Backend: Node.js, Express
- Database: SQLite using better-sqlite3

## Project Structure

- `client/` — React frontend
- `server/` — Express API and database

## Run Locally

### Backend

```bash
cd server
npm install
npm start
```

The API runs on port 4000.

### Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL shown by Vite.

## API Endpoints

- `GET /api/health` — Check API status
- `GET /api/expenses` — List expenses
- `POST /api/expenses` — Create an expense
- `DELETE /api/expenses/:id` — Delete an expense

## Current Limitations

- The frontend currently expects the backend at `http://localhost:4000`.
- Authentication and multi-user accounts are not implemented.
- Automated tests and deployment configuration are still in progress.

import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:4000/api/expenses";

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Other",
];

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function App() {
  const [expenses, setExpenses] = useState([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadExpenses() {
    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to load expenses.");
      }

      setExpenses(await response.json());
      setError("");
    } catch {
      setError(
        "Cannot connect to the backend. Please check that the server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  const total = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const cleanDescription = description.trim();
    const numericAmount = Number(amount);

    if (!cleanDescription) {
      setError("Please enter an expense description.");
      return;
    }

    if (
      amount.trim() === "" ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError("Please enter an amount greater than zero.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description: cleanDescription,
          amount: numericAmount,
          category,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to save expense.");
      }

      setExpenses((current) => [data, ...current]);
      setDescription("");
      setAmount("");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setError("");

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete expense.");
      }

      setExpenses((current) =>
        current.filter((expense) => expense.id !== id)
      );
    } catch (err) {
      setError(err.message || "Something went wrong.");
    }
  }

  const categoryTotals = categories.map((name) => ({
    name,
    total: expenses
      .filter((expense) => expense.category === name)
      .reduce((sum, expense) => sum + expense.amount, 0),
  }));

  return (
    <main className="app">
      <header className="header">
        <div>
          <p className="eyebrow">PERSONAL FINANCE</p>
          <h1>Expense Tracker</h1>
          <p className="subtitle">
            Track your spending, one expense at a time.
          </p>
        </div>
        <span className="status">Full Stack Project</span>
      </header>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <section className="total-card">
        <p>Total spending</p>
        <h2>{formatCurrency(total)}</h2>
        <span>{expenses.length} recorded expenses</span>
      </section>

      <div className="dashboard">
        <section className="panel">
          <h2>Add an expense</h2>

          <form onSubmit={handleSubmit}>
            <label htmlFor="description">Description</label>
            <input
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="e.g. Lunch"
              maxLength={100}
            />

            <label htmlFor="amount">Amount (₹)</label>
            <input
              id="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="e.g. 250"
            />

            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Add expense"}
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Spending by category</h2>

          <div className="category-list">
            {categoryTotals.map((item) => (
              <div className="category-row" key={item.name}>
                <span>{item.name}</span>
                <strong>{formatCurrency(item.total)}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel transactions">
        <h2>Recent expenses</h2>

        {loading ? (
          <p>Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p className="empty">
            No expenses yet. Add your first one above.
          </p>
        ) : (
          <div className="expense-list">
            {expenses.map((expense) => (
              <div className="expense-row" key={expense.id}>
                <div>
                  <strong>{expense.description}</strong>
                  <p>{expense.category}</p>
                </div>

                <div className="expense-actions">
                  <strong>{formatCurrency(expense.amount)}</strong>
                  <button
                    className="delete-button"
                    type="button"
                    onClick={() => handleDelete(expense.id)}
                    aria-label={`Delete ${expense.description}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;

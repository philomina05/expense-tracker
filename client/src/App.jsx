
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "/api/expenses";

const categories = ["Food", "Transport", "Shopping", "Bills", "Other"];

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
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadExpenses() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to load expenses.");
      }

      const data = await response.json();
      setExpenses(data);
    
} catch (err) {
  setError(
    "Could not load expenses. Please check that the backend server is running and try again."
  );
} finally {

      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  // Overall total: this is not affected by the category filter.
  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  );

  const filteredExpenses =
    selectedCategory === "All"
      ? expenses
      : expenses.filter(
          (expense) => expense.category === selectedCategory
        );

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const trimmedDescription = description.trim();
    const numericAmount = Number(amount);

    if (!trimmedDescription) {
      setError("Please enter an expense description.");
      return;
    }

    if (trimmedDescription.length > 100) {
      setError("Description must be 100 characters or fewer.");
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter an amount greater than zero.");
      return;
    }

    if (!categories.includes(category)) {
      setError("Please select a valid category.");
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
          description: trimmedDescription,
          amount: numericAmount,
          category,
        }),
      });

     
let data = {};

try {
  data = await response.json();
} catch {
  if (response.ok) {
    throw new Error("The server returned an invalid response.");
  }
}

if (!response.ok) {
  throw new Error(data.error || "Failed to add expense.");
}


      setExpenses((currentExpenses) => [data, ...currentExpenses]);
      setDescription("");
      setAmount("");
      setCategory("Food");

      // Keep the new expense visible if a different category was selected.
      setSelectedCategory("All");
    } catch (err) {
      setError(err.message || "Could not add expense. Please try again.");
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
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete expense.");
      }

      setExpenses((currentExpenses) =>
        currentExpenses.filter((expense) => expense.id !== id)
      );
    } catch (err) {
      setError(err.message || "Could not delete expense. Please try again.");
    }
  }

  const categoryTotals = categories.map((name) => ({
    name,
    total: expenses
      .filter((expense) => expense.category === name)
      .reduce((sum, expense) => sum + Number(expense.amount), 0),
  }));

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">PERSONAL FINANCE</p>
          <h1>Expense Tracker</h1>
          <p className="subtitle">
            Keep track of your spending, one expense at a time.
          </p>
        </div>
      </header>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <section className="summary-card">
        <div>
          <p className="summary-label">Total spending</p>
          <h2>{formatCurrency(total)}</h2>
        </div>

        <div className="summary-count">
          <span>{expenses.length}</span>
          <p>{expenses.length === 1 ? "expense recorded" : "expenses recorded"}</p>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <h2>Add an expense</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <input
                id="description"
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="e.g. Lunch"
                maxLength={100}
                required
              />
              <small>{description.length}/100 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount (₹)</label>
              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="e.g. 150"
                required
              />
            </div>

            <div className="form-group">
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
            </div>

            <button type="submit" disabled={saving}>
              {saving ? "Adding..." : "Add expense"}
            </button>
          </form>
        </section>

        <section className="panel">
          <h2>Spending by category</h2>

          <div className="category-list">
            {categoryTotals.map(({ name, total: categoryTotal }) => (
              <div className="category-item" key={name}>
                <div className="category-info">
                  <span>{name}</span>
                  <strong>{formatCurrency(categoryTotal)}</strong>
                </div>

                <div
                  className="category-bar"
                  role="progressbar"
                  aria-label={`${name} spending`}
                  aria-valuemin={0}
                  aria-valuemax={total || 1}
                  aria-valuenow={categoryTotal}
                >
                  <div
                    className="category-bar-fill"
                    style={{
                      width:
                        total > 0
                          ? `${Math.min((categoryTotal / total) * 100, 100)}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel transactions">
        <div className="transactions-header">
          <h2>Recent expenses</h2>

          <div className="filter-control">
            <label htmlFor="filter-category">Filter by category</label>
            <select
              id="filter-category"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
            >
              <option value="All">All categories</option>
              {categories.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <p className="empty">Loading expenses...</p>
        ) : expenses.length === 0 ? (
          <p className="empty">
            No expenses yet. Add your first one above.
          </p>
        ) : filteredExpenses.length === 0 ? (
          <p className="empty">
            No expenses found in this category. Try another category or select
            All categories.
          </p>
        ) : (
          <div className="expense-list">
            {filteredExpenses.map((expense) => (
              <div className="expense-row" key={expense.id}>
                <div className="expense-details">
                  <strong>{expense.description}</strong>
                  <span>{expense.category}</span>
                </div>

                <div className="expense-actions">
                  <strong>{formatCurrency(Number(expense.amount))}</strong>
                  <button
                    type="button"
                    className="delete-button"
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

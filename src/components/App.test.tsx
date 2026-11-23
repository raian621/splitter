import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { serializeLedger } from "../core/serialize";
import App from "./App";

beforeEach(() => {
  vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn() } });
  window.history.replaceState({}, "", "/");
});

describe("App", () => {
  it("allows adding people and expenses, then shows settlement", () => {
    render(<App />);

    // Add a new person
    const personInput = screen.getByLabelText("Person name");
    fireEvent.change(personInput, { target: { value: "Dave" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    // Open the expense modal
    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));

    // Add an expense
    fireEvent.change(screen.getByPlaceholderText("e.g. Dinner, Uber ride"), {
      target: { value: "Taxi" },
    });
    fireEvent.change(screen.getByPlaceholderText("0.00"), {
      target: { value: "60" },
    });
    fireEvent.change(screen.getByLabelText("Paid by"), {
      target: { value: "1" },
    });

    // Select Bob and Carol as additional participants
    fireEvent.click(screen.getByLabelText("Bob"));
    fireEvent.click(screen.getByLabelText("Carol"));

    fireEvent.click(screen.getByRole("button", { name: "Save expense" }));

    // Expense appears in list
    expect(screen.getByText("Taxi")).toBeInTheDocument();
    expect(screen.getAllByText("$60.00").length).toBeGreaterThanOrEqual(1);

    // Balances appear
    expect(screen.getByText("is owed $40.00")).toBeInTheDocument();
    expect(screen.getAllByText("owes $20.00").length).toBe(2);

    // Settlement appears
    expect(screen.getByText("Minimum transactions to settle all debts:")).toBeInTheDocument();
  });

  it("supports itemized splitting with proportional fees", () => {
    render(<App />);

    // Open the expense modal
    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));

    fireEvent.change(screen.getByPlaceholderText("e.g. Dinner, Uber ride"), {
      target: { value: "Dinner" },
    });
    fireEvent.change(screen.getByLabelText("Paid by"), {
      target: { value: "1" },
    });

    // Switch to itemized split
    fireEvent.click(screen.getByLabelText("Itemized"));

    // Fill in the first item for Alice
    fireEvent.change(screen.getByLabelText("Item 1 description"), {
      target: { value: "Burger" },
    });
    fireEvent.change(screen.getByLabelText("Item 1 amount"), {
      target: { value: "20" },
    });
    fireEvent.click(screen.getAllByLabelText("Alice")[0]);

    // Add a second item for Bob
    fireEvent.click(screen.getByRole("button", { name: "+ Add item" }));
    const item2Description = screen.getAllByLabelText(/Item \d+ description/)[1];
    const item2Amount = screen.getAllByLabelText(/Item \d+ amount/)[1];
    fireEvent.change(item2Description, { target: { value: "Fries" } });
    fireEvent.change(item2Amount, { target: { value: "10" } });
    fireEvent.click(screen.getAllByLabelText("Bob")[1]);

    // Set the default Tax fee to 0 so the total is predictable
    fireEvent.change(screen.getByLabelText("Fee 1 value"), {
      target: { value: "0" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save expense" }));

    // The itemized expense appears in the list
    expect(screen.getByText("Dinner")).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes("Split proportionally by items")),
    ).toBeInTheDocument();

    // Alice paid $30 and owes $20 (her burger), so she is owed $10
    expect(screen.getByText("is owed $10.00")).toBeInTheDocument();
    expect(screen.getByText("owes $10.00")).toBeInTheDocument();
  });

  it("loads state from a ledger URL parameter", () => {
    const ledger = {
      people: [
        { id: "1", name: "Alice" },
        { id: "2", name: "Bob" },
      ],
      expenses: [
        {
          id: "exp-1",
          description: "Shared ride",
          amount: 3000,
          payerId: "1",
          participantIds: ["1", "2"],
          splitMethod: "equal" as const,
        },
      ],
    };

    const url = new URL(window.location.href);
    url.search = `?ledger=${encodeURIComponent(serializeLedger(ledger))}`;
    window.history.replaceState({}, "", url.toString());

    render(<App />);

    expect(screen.getByText("Shared ride")).toBeInTheDocument();
    expect(screen.getByText("is owed $15.00")).toBeInTheDocument();
    expect(screen.getByText("owes $15.00")).toBeInTheDocument();
  });

  it("allows editing an existing expense", () => {
    render(<App />);

    // Add an equal-split expense
    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));
    fireEvent.change(screen.getByPlaceholderText("e.g. Dinner, Uber ride"), {
      target: { value: "Taxi" },
    });
    fireEvent.change(screen.getByPlaceholderText("0.00"), {
      target: { value: "60" },
    });
    fireEvent.change(screen.getByLabelText("Paid by"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByLabelText("Bob"));
    fireEvent.click(screen.getByLabelText("Carol"));
    fireEvent.click(screen.getByRole("button", { name: "Save expense" }));

    // Edit the expense
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByPlaceholderText("e.g. Dinner, Uber ride"), {
      target: { value: "Uber" },
    });
    fireEvent.change(screen.getByPlaceholderText("0.00"), {
      target: { value: "90" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update expense" }));

    // Updated expense and balances appear
    expect(screen.getByText("Uber")).toBeInTheDocument();
    expect(screen.getAllByText("$90.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("is owed $60.00")).toBeInTheDocument();
  });
});

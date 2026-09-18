import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { App } from "@/app/App";

describe("Application Shell Integration", () => {
  it("renders the BidSure government procurement portal by default at root '/'", async () => {
    render(<App />);
    await waitFor(
      () => {
        const heading = screen.getByRole("heading", { name: /BidSure.*e-Procurement Portal/i });
        expect(heading).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
    expect(screen.getByText(/Designated Access Portals/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Officer Console/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Bidder Portal/i).length).toBeGreaterThan(0);
  });
});

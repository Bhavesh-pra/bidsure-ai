import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Button } from "@/components/ui/button";

describe("Button Component", () => {
  it("renders with given text", () => {
    render(<Button>Submit Bid</Button>);
    expect(screen.getByRole("button", { name: /Submit Bid/i })).toBeInTheDocument();
  });

  it("disables button and displays spinner when loading", () => {
    render(<Button isLoading>Processing</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(screen.getByText(/Processing/i)).toBeInTheDocument();
  });
});

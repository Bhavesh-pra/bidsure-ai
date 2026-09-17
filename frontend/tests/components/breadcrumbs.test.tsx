import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";

describe("Breadcrumbs Component", () => {
  it("renders accessible navigation landmark with aria-label", () => {
    render(
      <MemoryRouter initialEntries={["/officer/tenders"]}>
        <Breadcrumbs />
      </MemoryRouter>
    );

    const nav = screen.getByRole("navigation", { name: /Breadcrumb/i });
    expect(nav).toBeInTheDocument();
  });

  it("auto-generates breadcrumb segments from current route path", () => {
    render(
      <MemoryRouter initialEntries={["/officer/tenders"]}>
        <Breadcrumbs />
      </MemoryRouter>
    );

    expect(screen.getByText("Officer Console")).toBeInTheDocument();
    expect(screen.getByText("Tenders")).toBeInTheDocument();
  });

  it("marks the last breadcrumb with aria-current='page'", () => {
    render(
      <MemoryRouter initialEntries={["/officer/tenders"]}>
        <Breadcrumbs />
      </MemoryRouter>
    );

    const activeItem = screen.getByText("Tenders");
    expect(activeItem).toHaveAttribute("aria-current", "page");
  });

  it("renders custom explicit breadcrumb items when provided", () => {
    const customItems = [
      { label: "Overview", href: "/overview" },
      { label: "Specific Project" },
    ];

    render(
      <MemoryRouter>
        <Breadcrumbs items={customItems} />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("href", "/overview");
    const current = screen.getByText("Specific Project");
    expect(current).toHaveAttribute("aria-current", "page");
  });
});

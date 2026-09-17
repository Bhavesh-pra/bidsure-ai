import { test, expect } from "@playwright/test";

test("has title and loads officer dashboard", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/frontend|BidSure/i);
  await expect(page.getByText("Procurement Officer Console")).toBeVisible();
});

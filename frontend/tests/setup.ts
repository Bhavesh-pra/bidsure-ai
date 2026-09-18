import "@testing-library/jest-dom";
import { configure } from "@testing-library/react";

// Increase default async timeout for reliable jsdom execution
configure({ asyncUtilTimeout: 10000 });

import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Without `test.globals: true`, @testing-library/react's own auto-cleanup
// can't find a global afterEach to hook into, so renders leak across tests
// in the same file. Wire it up explicitly instead.
afterEach(cleanup);

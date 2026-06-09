import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// jsdom does not implement scrollIntoView
Element.prototype.scrollIntoView = () => {};

import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "text-encoding";

// TextEncoder/TextDecoderを設定
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch globally
global.fetch = jest.fn();

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

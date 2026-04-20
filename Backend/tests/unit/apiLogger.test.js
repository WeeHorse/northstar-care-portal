import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { EventEmitter } from "node:events";
import { apiLogger } from "../../server/middleware/apiLogger.js";

function createMockRequest(overrides = {}) {
  return {
    path: "/api/test",
    originalUrl: "/api/test?foo=bar",
    method: "GET",
    headers: {},
    ip: "127.0.0.1",
    user: undefined,
    ...overrides
  };
}

function createMockResponse(statusCode = 200) {
  const emitter = new EventEmitter();
  const response = {
    statusCode,
    writableEnded: true,
    headers: {},
    on(eventName, handler) {
      emitter.on(eventName, handler);
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    emit(eventName) {
      emitter.emit(eventName);
    }
  };

  return response;
}

describe("api logger middleware", () => {
  let logSpy;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => { });
    vi.spyOn(console, "warn").mockImplementation(() => { });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets x-request-id from incoming header", () => {
    const req = createMockRequest({ headers: { "x-request-id": "external-id" } });
    const res = createMockResponse();
    const next = vi.fn();

    apiLogger(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.requestId).toBe("external-id");
    expect(res.headers["x-request-id"]).toBe("external-id");
  });

  it("creates x-request-id when missing and logs request completion", () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = vi.fn();

    apiLogger(req, res, next);
    res.emit("finish");

    expect(next).toHaveBeenCalledOnce();
    expect(req.requestId).toBeTypeOf("string");
    expect(req.requestId.length).toBeGreaterThan(10);
    expect(res.headers["x-request-id"]).toBe(req.requestId);
    expect(logSpy).toHaveBeenCalled();
  });

  it("skips non-api routes", () => {
    const req = createMockRequest({ path: "/health", originalUrl: "/health" });
    const res = createMockResponse();
    const next = vi.fn();

    apiLogger(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.requestId).toBeUndefined();
    expect(res.headers["x-request-id"]).toBeUndefined();
  });
});

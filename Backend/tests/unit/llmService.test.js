import { afterEach, describe, expect, it, vi } from "vitest";
import { createLlmService } from "../../server/services/llmService.js";

describe("llmService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.AZURE_OPENAI_ENDPOINT;
    delete process.env.AZURE_OPENAI_API_KEY;
    delete process.env.AZURE_OPENAI_DEPLOYMENT;
    delete process.env.AZURE_OPENAI_API_VERSION;
  });

  it("falls back to local mock responses when Azure config is missing", async () => {
    const service = createLlmService();

    const result = await service.generateResponse({
      mode: "safe",
      question: "What should I do if I miss a dose?",
      contextItems: [{ excerpt: "Take the missed dose as soon as you remember unless it is nearly time for the next dose." }],
      history: []
    });

    expect(result).toMatch(/missed dose/i);
  });

  it("calls Azure Responses API when Azure config is present", async () => {
    process.env.AZURE_OPENAI_ENDPOINT = "https://example-resource.cognitiveservices.azure.com";
    process.env.AZURE_OPENAI_API_KEY = "test-key";
    process.env.AZURE_OPENAI_DEPLOYMENT = "gpt-5.4-mini";
    process.env.AZURE_OPENAI_API_VERSION = "2025-04-01-preview";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        output: [
          {
            type: "message",
            content: [
              { type: "output_text", text: "Azure generated answer" }
            ]
          }
        ]
      })
    });

    const service = createLlmService();
    const result = await service.generateResponse({
      mode: "safe",
      question: "What self-care advice applies?",
      contextItems: [{ title: "Patient Advice", contentClass: "PATIENT", excerpt: "Stay hydrated and contact healthcare staff if symptoms worsen." }],
      history: [{ role: "user", content: "Hello" }],
      userId: 7
    });

    expect(result).toBe("Azure generated answer");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe("https://example-resource.cognitiveservices.azure.com/openai/responses?api-version=2025-04-01-preview");
  });
});
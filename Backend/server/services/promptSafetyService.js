const PROMPT_INJECTION_PATTERNS = [
  { key: "ignore_previous_instructions", regex: /ignore\s+(all\s+)?(previous|prior)\s+instructions/i },
  { key: "reveal_system_prompt", regex: /reveal\s+(the\s+)?(full\s+)?system\s+prompt/i },
  { key: "show_hidden_instructions", regex: /show\s+(all\s+)?hidden\s+instructions/i },
  { key: "assume_admin", regex: /you\s+are\s+now\s+(an\s+)?(admin|internal\s+clinical\s+assistant)/i },
  { key: "staff_only_request", regex: /staff[-\s]?only|internal\s+guidance/i },
  { key: "print_full_context", regex: /print\s+(the\s+)?full\s+context/i },
  { key: "show_all_sources", regex: /show\s+all\s+sources|list\s+all\s+internal\s+sources/i },
  { key: "ignore_safety_rules", regex: /ignore\s+safety\s+rules/i }
];

const DIRECT_EXPOSURE_KEYS = new Set([
  "reveal_system_prompt",
  "show_hidden_instructions",
  "assume_admin",
  "staff_only_request",
  "print_full_context",
  "show_all_sources",
  "ignore_safety_rules"
]);

export function createPromptSafetyService() {
  return {
    inspectQuestion(question) {
      const matches = PROMPT_INJECTION_PATTERNS
        .filter((pattern) => pattern.regex.test(String(question || "")))
        .map((pattern) => pattern.key);

      return {
        suspicious: matches.length > 0,
        matches,
        directExposureAttempt: matches.some((key) => DIRECT_EXPOSURE_KEYS.has(key))
      };
    },
    shouldBlock({ mode, isPrivileged, inspection }) {
      if (mode !== "safe") {
        return false;
      }

      if (!inspection.suspicious) {
        return false;
      }

      return inspection.directExposureAttempt && !isPrivileged;
    },
    createRefusal() {
      return "I can provide general treatment and medication guidance, but I cannot reveal internal staff instructions. If symptoms are worsening or you are unsure about treatment, contact healthcare staff.";
    }
  };
}
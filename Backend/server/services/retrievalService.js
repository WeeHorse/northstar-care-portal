function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text) {
  return normalize(text).split(" ").filter(Boolean);
}

function inferContentClass(item) {
  const text = normalize([item.title, item.description, item.body_markdown, item.tags, item.category].filter(Boolean).join(" "));
  const patientSignals = ["patient", "medication", "self care", "warning", "missed dose", "treatment"];
  const internalSignals = ["staff only", "internal", "workflow", "triage", "hidden instructions", "escalate"];

  if (internalSignals.some((signal) => text.includes(signal))) {
    return "INTERNAL";
  }

  if (patientSignals.some((signal) => text.includes(signal))) {
    return "PATIENT";
  }

  return ["Internal", "Confidential"].includes(item.classification) ? "INTERNAL" : "PATIENT";
}

function scoreCandidate(question, candidate) {
  const questionTokens = tokenize(question);
  if (questionTokens.length === 0) {
    return 1;
  }

  const haystacks = [candidate.title, candidate.content, candidate.tags, candidate.category].map(normalize);
  return questionTokens.reduce((score, token) => {
    return score + haystacks.reduce((inner, haystack) => inner + (haystack.includes(token) ? 2 : 0), 0);
  }, 0);
}

function excerpt(text, length = 220) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (value.length <= length) {
    return value;
  }
  return `${value.slice(0, length - 3)}...`;
}

function toSource(candidate) {
  return {
    sourceType: candidate.sourceType,
    id: candidate.id,
    title: candidate.title,
    classification: candidate.classification,
    category: candidate.category,
    contentClass: candidate.contentClass,
    excerpt: candidate.excerpt
  };
}

export function createRetrievalService({ documentsRepository, proceduresRepository }) {
  function listCandidates() {
    const documents = documentsRepository.listAccessible("Admin").map((doc) => ({
      id: doc.id,
      sourceType: "document",
      title: doc.title,
      classification: doc.classification,
      category: doc.category,
      tags: doc.tags,
      description: doc.description,
      content: [doc.description, doc.tags].filter(Boolean).join(" ")
    }));

    const procedures = proceduresRepository.list().map((procedure) => ({
      id: procedure.id,
      sourceType: "procedure",
      title: procedure.title,
      classification: procedure.classification,
      category: procedure.category,
      tags: procedure.owner_team,
      body_markdown: procedure.body_markdown,
      content: procedure.body_markdown
    }));

    return [...documents, ...procedures].map((item) => ({
      ...item,
      contentClass: inferContentClass(item),
      excerpt: excerpt(item.content)
    }));
  }

  function isPrivilegedRole(role) {
    return ["Admin", "Manager", "Clinician"].includes(role);
  }

  return {
    retrieve({ question, userRole, mode }) {
      const privileged = isPrivilegedRole(userRole);
      const scored = listCandidates()
        .map((candidate) => ({
          candidate,
          score: scoreCandidate(question, candidate)
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);

      const selected = [];
      for (const item of scored) {
        const candidate = item.candidate;
        if (mode === "safe" && !privileged && candidate.contentClass === "INTERNAL") {
          continue;
        }
        selected.push(candidate);
        if (selected.length === 4) {
          break;
        }
      }

      const internalCandidates = selected.filter((candidate) => candidate.contentClass === "INTERNAL");
      const permissionMismatches = mode === "unsafe" && !privileged ? internalCandidates.map(toSource) : [];

      return {
        contextItems: selected,
        sources: selected.map(toSource),
        internalIncluded: internalCandidates.length > 0,
        internalSourceCount: internalCandidates.length,
        permissionMismatches,
        sourceCount: selected.length,
        privileged
      };
    },
    isPrivilegedRole
  };
}
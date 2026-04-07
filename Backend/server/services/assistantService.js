function canReadProcedure(userRole, procedure) {
  if (userRole === "Admin") return true;
  if (procedure.classification === "Internal") {
    return ["SupportAgent", "Manager", "Clinician"].includes(userRole);
  }
  if (procedure.classification === "Confidential") {
    return ["Clinician", "Manager"].includes(userRole);
  }
  return false;
}

function normalize(text) {
  return String(text || "").toLowerCase();
}

function scoreMatch(question, fields) {
  const q = normalize(question);
  if (!q.trim()) return 1;
  return fields.reduce((score, field) => {
    const hay = normalize(field);
    if (!hay) return score;
    return score + (hay.includes(q) ? 3 : 0) + q.split(/\s+/).filter((part) => part && hay.includes(part)).length;
  }, 0);
}

function pickTop(matches, max = 4) {
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((item) => item.source);
}

function makeAnswerText(question, sources) {
  const prefix = question ? `Question: ${question}. ` : "";
  if (sources.length === 0) {
    return `${prefix}No strongly relevant internal sources were found.`;
  }
  const list = sources.map((source) => source.title).join(", ");
  return `${prefix}Suggested guidance based on internal sources: ${list}.`;
}

export function createAssistantService({ documentsRepository, proceduresRepository, adminRepository, auditRepository }) {
  const answerSources = new Map();

  return {
    getRoleAwareMode() {
      return { mode: adminRepository.getAssistantRoleAwareMode() };
    },
    setRoleAwareMode({ mode, actorUserId }) {
      if (!["enabled", "disabled"].includes(mode)) {
        return { invalidMode: true };
      }
      const next = adminRepository.setAssistantRoleAwareMode(mode);
      auditRepository.write({
        actorUserId,
        eventType: "assistant_mode_change",
        entityType: "system_setting",
        entityId: "assistant_role_aware_mode",
        result: "success",
        metadataJson: JSON.stringify({ mode: next })
      });
      return { mode: next };
    },
    ask({ question, user }) {
      const roleAwareMode = adminRepository.getAssistantRoleAwareMode();
      const useRoleAware = roleAwareMode === "enabled";

      const visibleDocuments = useRoleAware
        ? documentsRepository.listAccessible(user.role)
        : documentsRepository.listAccessible("Admin");

      const visibleProcedures = useRoleAware
        ? proceduresRepository.list().filter((procedure) => canReadProcedure(user.role, procedure))
        : proceduresRepository.list();

      const documentMatches = visibleDocuments.map((doc) => ({
        score: scoreMatch(question, [doc.title, doc.description, doc.category, doc.tags]),
        source: {
          sourceType: "document",
          id: doc.id,
          title: doc.title,
          classification: doc.classification,
          category: doc.category
        }
      }));

      const procedureMatches = visibleProcedures.map((procedure) => ({
        score: scoreMatch(question, [procedure.title, procedure.body_markdown, procedure.category]),
        source: {
          sourceType: "procedure",
          id: procedure.id,
          title: procedure.title,
          classification: procedure.classification,
          category: procedure.category
        }
      }));

      const sources = pickTop([...documentMatches, ...procedureMatches]);
      const permissionMismatches = [];

      if (!useRoleAware) {
        for (const source of sources) {
          if (source.sourceType === "document") {
            const allowed = documentsRepository.findByIdAccessible(source.id, user.role);
            if (!allowed) {
              permissionMismatches.push(source);
            }
          }
          if (source.sourceType === "procedure") {
            const procedure = proceduresRepository.findById(source.id);
            if (procedure && !canReadProcedure(user.role, procedure)) {
              permissionMismatches.push(source);
            }
          }
        }
      }

      const answerId = `ans-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      answerSources.set(answerId, { sources, permissionMismatches, createdAt: new Date().toISOString() });

      auditRepository.write({
        actorUserId: user.id,
        eventType: "assistant_query",
        entityType: "assistant",
        entityId: answerId,
        result: "success",
        metadataJson: JSON.stringify({ questionLength: String(question || "").length, sourceCount: sources.length })
      });

      if (permissionMismatches.length > 0) {
        auditRepository.write({
          actorUserId: user.id,
          eventType: "assistant_permission_mismatch",
          entityType: "assistant",
          entityId: answerId,
          result: "warning",
          metadataJson: JSON.stringify({ mismatchCount: permissionMismatches.length })
        });
      }

      return {
        answerId,
        answer: makeAnswerText(question, sources),
        sources,
        permissionMismatches,
        mode: roleAwareMode
      };
    },
    getAnswerSources({ answerId }) {
      return answerSources.get(answerId) || null;
    },
    listPermissionMismatchEvents({ limit }) {
      return auditRepository.list({ eventType: "assistant_permission_mismatch", limit }).map((item) => ({
        id: item.id,
        actorUserId: item.actor_user_id,
        eventType: item.event_type,
        entityType: item.entity_type,
        entityId: item.entity_id,
        result: item.result,
        metadataJson: item.metadata_json,
        createdAt: item.created_at
      }));
    }
  };
}

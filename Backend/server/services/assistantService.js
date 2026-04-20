import { createPromptSafetyService } from "./promptSafetyService.js";
import { createRetrievalService } from "./retrievalService.js";
import { createLlmService } from "./llmService.js";

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function toStoredEnvelope(result) {
  return {
    sources: result.sources,
    permissionMismatches: result.permissionMismatches,
    blocked: result.blocked,
    suspiciousPrompt: result.security.suspicious,
    suspiciousPatterns: result.security.suspiciousPatterns,
    mode: result.mode,
    createdAt: new Date().toISOString()
  };
}

export function createAssistantService({ documentsRepository, proceduresRepository, adminRepository, auditRepository }) {
  const promptSafetyService = createPromptSafetyService();
  const retrievalService = createRetrievalService({ documentsRepository, proceduresRepository });
  const llmService = createLlmService();
  const answerSources = new Map();
  const conversations = new Map();

  function writeEvent({ actorUserId, eventType, entityId, result, metadata }) {
    auditRepository.write({
      actorUserId,
      eventType,
      entityType: "assistant",
      entityId,
      result,
      metadataJson: JSON.stringify({
        timestamp: new Date().toISOString(),
        ...metadata
      })
    });
  }

  function getMode() {
    return adminRepository.getAssistantMode();
  }

  return {
    getMode() {
      return { mode: getMode() };
    },
    getRoleAwareMode() {
      return { mode: adminRepository.getAssistantRoleAwareMode() };
    },
    setMode({ mode, actorUserId }) {
      if (!["safe", "unsafe"].includes(mode)) {
        return { invalidMode: true };
      }
      const next = adminRepository.setAssistantMode(mode);
      adminRepository.setAssistantRoleAwareMode(mode === "safe" ? "enabled" : "disabled");
      writeEvent({
        actorUserId,
        eventType: "assistant_mode_changed",
        entityId: "assistant_mode",
        result: "success",
        metadata: { mode: next }
      });
      return { mode: next };
    },
    setRoleAwareMode({ mode, actorUserId }) {
      if (!["enabled", "disabled"].includes(mode)) {
        return { invalidMode: true };
      }
      return this.setMode({ mode: mode === "enabled" ? "safe" : "unsafe", actorUserId });
    },
    async ask({ question, user, conversationId }) {
      const mode = getMode();
      const activeConversationId = conversationId || createId("conv");
      const history = conversations.get(activeConversationId) || [];
      const inspection = promptSafetyService.inspectQuestion(question);
      const privileged = retrievalService.isPrivilegedRole(user.role);
      const blocked = promptSafetyService.shouldBlock({ mode, isPrivileged: privileged, inspection });
      const retrieval = retrievalService.retrieve({ question, userRole: user.role, mode });
      const answerId = createId("ans");

      const answer = blocked
        ? promptSafetyService.createRefusal()
        : await llmService.generateResponse({
          mode,
          question,
          contextItems: retrieval.contextItems,
          history,
          blocked,
          userId: user.id
        });

      writeEvent({
        actorUserId: user.id,
        eventType: "assistant_query",
        entityId: answerId,
        result: "success",
        metadata: {
          userRole: user.role,
          mode,
          question,
          responsePreview: String(answer || "").slice(0, 180),
          sessionId: activeConversationId
        }
      });

      writeEvent({
        actorUserId: user.id,
        eventType: "assistant_retrieval",
        entityId: answerId,
        result: retrieval.sourceCount > 0 ? "success" : "warning",
        metadata: {
          userRole: user.role,
          mode,
          question,
          sourceCount: retrieval.sourceCount,
          internalSourceCount: retrieval.internalSourceCount,
          sourceTitles: retrieval.sources.map((source) => source.title),
          sessionId: activeConversationId
        }
      });

      if (inspection.suspicious) {
        writeEvent({
          actorUserId: user.id,
          eventType: "assistant_prompt_injection_flag",
          entityId: answerId,
          result: blocked ? "denied" : "warning",
          metadata: {
            userRole: user.role,
            mode,
            question,
            suspiciousPatterns: inspection.matches,
            blocked,
            sessionId: activeConversationId
          }
        });
      }

      if (retrieval.permissionMismatches.length > 0) {
        writeEvent({
          actorUserId: user.id,
          eventType: "assistant_permission_mismatch",
          entityId: answerId,
          result: "warning",
          metadata: {
            userRole: user.role,
            mode,
            question,
            mismatchCount: retrieval.permissionMismatches.length,
            sourceTitles: retrieval.permissionMismatches.map((source) => source.title),
            sessionId: activeConversationId
          }
        });
      }

      if (blocked) {
        writeEvent({
          actorUserId: user.id,
          eventType: "assistant_response_blocked",
          entityId: answerId,
          result: "denied",
          metadata: {
            userRole: user.role,
            mode,
            question,
            suspiciousPatterns: inspection.matches,
            responsePreview: String(answer || "").slice(0, 180),
            blocked: true,
            sessionId: activeConversationId
          }
        });
      }

      const visibleSources = blocked ? [] : retrieval.sources;
      const visibleMismatches = blocked ? [] : retrieval.permissionMismatches;
      const assistantMessage = {
        id: answerId,
        role: "assistant",
        content: answer,
        sources: visibleSources
      };

      conversations.set(activeConversationId, [
        ...history,
        { id: createId("msg"), role: "user", content: question },
        assistantMessage
      ]);

      const result = {
        conversationId: activeConversationId,
        answerId,
        answer,
        message: assistantMessage,
        sources: visibleSources,
        permissionMismatches: visibleMismatches,
        mode,
        blocked,
        security: {
          suspicious: inspection.suspicious,
          suspiciousPatterns: inspection.matches,
          blocked,
          internalSourceCount: blocked ? 0 : retrieval.internalSourceCount,
          sourceCount: blocked ? 0 : retrieval.sourceCount
        }
      };

      answerSources.set(answerId, toStoredEnvelope(result));
      return result;
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

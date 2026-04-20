const ALLOWED_SECURITY_MODES = new Set(["secure", "misconfigured"]);

function parseMetadata(metadataJson) {
  if (!metadataJson) {
    return null;
  }

  try {
    return JSON.parse(metadataJson);
  } catch {
    return null;
  }
}

function buildAssistantDiagnostics(eventType, metadata) {
  if (!eventType?.startsWith("assistant_") || !metadata) {
    return null;
  }

  return {
    mode: metadata.mode ?? null,
    suspiciousPatterns: Array.isArray(metadata.suspiciousPatterns) ? metadata.suspiciousPatterns : [],
    sourceCount: metadata.sourceCount ?? null,
    internalSourceCount: metadata.internalSourceCount ?? null,
    mismatchCount: metadata.mismatchCount ?? null,
    blocked: metadata.blocked ?? null,
    question: metadata.question ?? null,
    responsePreview: metadata.responsePreview ?? null,
    sessionId: metadata.sessionId ?? metadata.conversationId ?? null
  };
}

export function createAdminService({ adminRepository, auditRepository }) {
  return {
    listUsers() {
      return adminRepository.listUsers().map((user) => ({
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        role: user.role,
        isActive: Boolean(user.is_active)
      }));
    },
    changeUserRole({ targetUserId, roleName, actorUserId }) {
      const target = adminRepository.findUserById(targetUserId);
      if (!target) return { notFound: true };

      const role = adminRepository.findRoleByName(roleName);
      if (!role) return { invalidRole: true };

      const updated = adminRepository.updateUserRole(targetUserId, role.id);
      auditRepository.write({
        actorUserId,
        eventType: "user_role_change",
        entityType: "user",
        entityId: String(targetUserId),
        result: "success",
        metadataJson: JSON.stringify({ newRole: role.name })
      });

      return {
        id: updated.id,
        username: updated.username,
        fullName: updated.full_name,
        role: updated.role,
        isActive: Boolean(updated.is_active)
      };
    },
    getSecurityMode() {
      return { mode: adminRepository.getSecurityMode() };
    },
    setSecurityMode({ mode, actorUserId }) {
      if (!ALLOWED_SECURITY_MODES.has(mode)) {
        return { invalidMode: true };
      }
      const nextMode = adminRepository.setSecurityMode(mode);
      auditRepository.write({
        actorUserId,
        eventType: "security_mode_change",
        entityType: "system_setting",
        entityId: "security_mode",
        result: "success",
        metadataJson: JSON.stringify({ mode: nextMode })
      });
      return { mode: nextMode };
    },
    listAuditLogs({ eventType, result, limit, createdFrom, createdTo, actorUser, actorRole, search }) {
      return auditRepository.list({ eventType, result, limit, createdFrom, createdTo, actorUser, actorRole, search }).map((item) => {
        const metadata = parseMetadata(item.metadata_json);
        return {
          id: item.id,
          actorUserId: item.actor_user_id,
          actorUsername: item.actor_username,
          actorFullName: item.actor_full_name,
          actorRole: item.actor_role,
          eventType: item.event_type,
          entityType: item.entity_type,
          entityId: item.entity_id,
          result: item.result,
          metadataJson: item.metadata_json,
          metadata,
          assistantDiagnostics: buildAssistantDiagnostics(item.event_type, metadata),
          createdAt: item.created_at
        };
      });
    }
  };
}

const ALLOWED_SECURITY_MODES = new Set(["secure", "misconfigured"]);

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
    listAuditLogs({ eventType, result, limit }) {
      return auditRepository.list({ eventType, result, limit }).map((item) => ({
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

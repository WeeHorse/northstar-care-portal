function toRestrictedRecordView(record, role) {
  if (role === "SupportAgent" || role === "ExternalConsultant") {
    return {
      id: record.id,
      patientRef: record.patient_ref,
      status: record.status,
      sensitivityLevel: record.sensitivity_level,
      lastContactAt: record.last_contact_at
    };
  }

  return {
    id: record.id,
    patientRef: record.patient_ref,
    summary: record.summary,
    status: record.status,
    sensitivityLevel: record.sensitivity_level,
    lastContactAt: record.last_contact_at,
    ownerTeam: record.owner_team,
    createdAt: record.created_at,
    updatedAt: record.updated_at
  };
}

export function createRecordsService({ recordsRepository, auditRepository }) {
  return {
    listRecords(user) {
      const items = recordsRepository.list();
      return items.map((item) => toRestrictedRecordView(item, user.role));
    },
    getRecordById({ id, user }) {
      const item = recordsRepository.findById(id);
      if (!item) {
        return null;
      }
      auditRepository.write({
        actorUserId: user.id,
        eventType: "record_view",
        entityType: "record",
        entityId: String(item.id),
        result: "success"
      });
      return toRestrictedRecordView(item, user.role);
    }
  };
}

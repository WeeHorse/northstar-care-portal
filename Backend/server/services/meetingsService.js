function canAccessMeeting(user, meeting) {
  if (user.role === "Admin") return true;
  if (user.role === "Manager") return user.team ? meeting.team === user.team : true;
  return meeting.created_by_user_id === user.id;
}

export function createMeetingsService({ meetingsRepository, auditRepository }) {
  return {
    listMeetings({ user, team }) {
      const filters = {};
      if (user.role === "SupportAgent") {
        filters.createdByUserId = user.id;
      }
      if (team && ["Manager", "Admin"].includes(user.role)) {
        filters.team = team;
      }
      const items = meetingsRepository.list(filters);
      return items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        meetingType: item.meeting_type,
        startAt: item.start_at,
        endAt: item.end_at,
        teamsLink: item.teams_link,
        team: item.team,
        createdByUserId: item.created_by_user_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    },
    getMeetingById({ id, user }) {
      const item = meetingsRepository.findById(id);
      if (!item) {
        return null;
      }
      if (!canAccessMeeting(user, item)) {
        return { denied: true };
      }
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        meetingType: item.meeting_type,
        startAt: item.start_at,
        endAt: item.end_at,
        teamsLink: item.teams_link,
        team: item.team,
        createdByUserId: item.created_by_user_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      };
    },
    createMeeting({ payload, user }) {
      const created = meetingsRepository.create({
        title: payload.title,
        description: payload.description,
        meetingType: payload.meetingType || "digital",
        startAt: payload.startAt,
        endAt: payload.endAt,
        teamsLink: payload.teamsLink || "https://teams.example/placeholder",
        createdByUserId: user.id,
        team: payload.team || "support"
      });

      auditRepository.write({
        actorUserId: user.id,
        eventType: "meeting_create",
        entityType: "meeting",
        entityId: String(created.id),
        result: "success"
      });

      return {
        id: created.id,
        title: created.title,
        description: created.description,
        meetingType: created.meeting_type,
        startAt: created.start_at,
        endAt: created.end_at,
        teamsLink: created.teams_link,
        team: created.team,
        createdByUserId: created.created_by_user_id,
        createdAt: created.created_at,
        updatedAt: created.updated_at
      };
    }
  };
}

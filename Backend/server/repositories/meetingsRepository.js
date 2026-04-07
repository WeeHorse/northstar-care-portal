export function createMeetingsRepository(db) {
  return {
    list(filters = {}) {
      const values = [];
      const where = [];

      if (filters.team) {
        where.push("team = ?");
        values.push(filters.team);
      }
      if (filters.createdByUserId) {
        where.push("created_by_user_id = ?");
        values.push(filters.createdByUserId);
      }
      if (filters.day) {
        where.push("date(start_at) = date(?)");
        values.push(filters.day);
      }

      const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
      return db
        .prepare(
          `SELECT id, title, description, meeting_type, start_at, end_at, teams_link, created_by_user_id, team, created_at, updated_at
           FROM meetings
           ${whereClause}
           ORDER BY start_at ASC`
        )
        .all(...values);
    },
    findById(id) {
      return db
        .prepare(
          `SELECT id, title, description, meeting_type, start_at, end_at, teams_link, created_by_user_id, team, created_at, updated_at
           FROM meetings
           WHERE id = ?`
        )
        .get(id);
    },
    create(payload) {
      const now = new Date().toISOString();
      const result = db
        .prepare(
          `INSERT INTO meetings (title, description, meeting_type, start_at, end_at, teams_link, created_by_user_id, team, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          payload.title,
          payload.description ?? null,
          payload.meetingType,
          payload.startAt,
          payload.endAt,
          payload.teamsLink,
          payload.createdByUserId,
          payload.team ?? null,
          now,
          now
        );
      return this.findById(result.lastInsertRowid);
    },
    update(id, payload) {
      const current = this.findById(id);
      if (!current) {
        return null;
      }

      const next = {
        title: payload.title ?? current.title,
        description: payload.description ?? current.description,
        meeting_type: payload.meetingType ?? current.meeting_type,
        start_at: payload.startAt ?? current.start_at,
        end_at: payload.endAt ?? current.end_at,
        teams_link: payload.teamsLink ?? current.teams_link,
        team: payload.team ?? current.team
      };

      db.prepare(
        `UPDATE meetings
         SET title = ?, description = ?, meeting_type = ?, start_at = ?, end_at = ?, teams_link = ?, team = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        next.title,
        next.description,
        next.meeting_type,
        next.start_at,
        next.end_at,
        next.teams_link,
        next.team,
        new Date().toISOString(),
        id
      );

      return this.findById(id);
    }
  };
}

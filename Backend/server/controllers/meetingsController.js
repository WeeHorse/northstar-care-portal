export function createMeetingsController(meetingsService) {
  return {
    list(req, res) {
      const items = meetingsService.listMeetings({ user: req.user, team: req.query.team, day: req.query.day });
      return res.status(200).json({ items, total: items.length });
    },
    getById(req, res) {
      const item = meetingsService.getMeetingById({ id: Number(req.params.id), user: req.user });
      if (!item) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      if (item.denied) {
        return res.status(403).json({ error: "Forbidden" });
      }
      return res.status(200).json(item);
    },
    create(req, res) {
      const { title, startAt, endAt } = req.body || {};
      if (!title || !startAt || !endAt) {
        return res.status(400).json({ error: "title, startAt, and endAt are required" });
      }
      const created = meetingsService.createMeeting({ payload: req.body, user: req.user });
      return res.status(201).json(created);
    },
    update(req, res) {
      const updated = meetingsService.updateMeeting({
        id: Number(req.params.id),
        payload: req.body || {},
        user: req.user
      });

      if (!updated) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      if (updated.denied) {
        return res.status(403).json({ error: "Forbidden" });
      }

      return res.status(200).json(updated);
    }
  };
}

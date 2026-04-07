export function createAuthController(authService) {
  return {
    login(req, res) {
      const { username, password } = req.body || {};
      if (!username || !password) {
        return res.status(400).json({ error: "username and password are required" });
      }
      const result = authService.login({ username, password });
      if (!result) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      return res.status(200).json(result);
    },
    me(req, res) {
      const user = authService.me(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          role: user.role
        }
      });
    },
    logout(req, res) {
      return res.status(200).json({ message: "Logged out" });
    }
  };
}

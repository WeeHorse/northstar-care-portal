import { NavLink } from "react-router-dom";
import { useAuth } from "../app/auth";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/cases", label: "Cases" },
  { to: "/records", label: "Records" },
  { to: "/documents", label: "Documents" },
  { to: "/procedures", label: "Procedures" },
  { to: "/meetings", label: "Meetings" },
  { to: "/admin", label: "Admin" }
];

export function AppShell({ children }) {
  const { user, clearSession } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Northstar</h1>
        <p className="subtitle">Care Portal</p>
        <nav>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? "active" : "") }>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p>{user?.fullName || user?.username}</p>
          <p>{user?.role}</p>
          <button onClick={clearSession}>Logout</button>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}

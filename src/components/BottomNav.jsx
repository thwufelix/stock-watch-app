import React from "react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", icon: "🏠", label: "關注", end: true },
  { to: "/portfolio", icon: "🧺", label: "組合風險" },
  { to: "/industry", icon: "🏭", label: "產業鏈" },
  { to: "/settings", icon: "⚙️", label: "設定" },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

import { NavLink } from "react-router-dom";

export function MobileMenu({ items, onClose }) {
  return (
    <nav
      className="border-b border-slate-800 bg-slate-950 px-4 py-3 md:hidden"
      aria-label="Mobile menu"
    >
      <div className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `block rounded-lg px-4 py-3 text-sm ${
                isActive
                  ? "bg-amber-300 font-semibold text-slate-950"
                  : "text-slate-300"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

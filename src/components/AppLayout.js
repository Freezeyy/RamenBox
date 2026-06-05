import { signOut } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useAuth } from "../auth/AuthContext";

const NAV = [
  { path: "/dashboard", label: "Dashboard", match: (p) => p === "/dashboard" },
  { path: "/", label: "New Order", match: (p) => p === "/" },
  { path: "/orders", label: "Sales", match: (p) => p === "/orders" },
  { path: "/inventory", label: "Inventory", match: (p) => p === "/inventory" },
  { path: "/qr", label: "QR", match: (p) => p === "/qr" },
];

const ROUTES = {
  "/dashboard": { title: "Dashboard", url: "localhost:3000/dashboard" },
  "/": { title: "Ramen POS", url: "localhost:3000/" },
  "/orders": { title: "Sales History", url: "localhost:3000/orders" },
  "/inventory": { title: "Inventory", url: "localhost:3000/inventory" },
  "/qr": { title: "QR Payment", url: "localhost:3000/qr" },
};

export default function AppLayout({ title, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role } = useAuth();
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "inventory"), (snap) => {
      setInventory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const lowStock = useMemo(
    () =>
      inventory.filter(
        (it) => Number(it.quantity ?? 0) <= Number(it.lowStockThreshold ?? 0)
      ),
    [inventory]
  );

  const meta = ROUTES[location.pathname] ?? {
    title: title ?? "Smart Ramen POS",
    url: `localhost:3000${location.pathname}`,
  };

  const logout = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (e) {
      console.error("Logout failed:", e);
      alert("Failed to logout. Try again.");
    }
  };

  const displayName = user?.email?.split("@")[0] ?? "User";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand-button" type="button" onClick={() => navigate("/dashboard")}>
          <span className="brand-mark">SR</span>
          <span>Smart Ramen POS</span>
        </button>

        <nav className="nav-list">
          {NAV.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`nav-item${item.match(location.pathname) ? " is-active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button className="logout-button" type="button" onClick={logout}>
          Logout
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{meta.url}</p>
            <h2>{title ?? meta.title}</h2>
          </div>
          <div className="cashier-chip">
            <span>{displayName}</span>
            <small>
              {role ?? "cashier"} · Register open
            </small>
          </div>
        </header>

        {lowStock.length > 0 && (
          <section className="alert-strip">
            <strong>Low stock</strong>
            <span>
              {lowStock
                .map((it) => `${it.name ?? it.id} — ${Number(it.quantity ?? 0)} units`)
                .join(", ")}
            </span>
          </section>
        )}

        {children}
      </section>
    </div>
  );
}

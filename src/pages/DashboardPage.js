import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import AppLayout from "../components/AppLayout";
import "../styles.css";

function isToday(iso) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubInv = onSnapshot(collection(db, "inventory"), (snap) => {
      setInventory(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsubOrders();
      unsubInv();
    };
  }, []);

  const todayOrders = useMemo(
    () => orders.filter((o) => o.createdAt && isToday(o.createdAt)),
    [orders]
  );

  const todaySales = todayOrders.reduce((sum, o) => sum + Number(o.total ?? 0), 0);
  const avgOrder = todayOrders.length ? todaySales / todayOrders.length : 0;

  const lowStock = useMemo(
    () =>
      inventory.filter(
        (it) => Number(it.quantity ?? 0) <= Number(it.lowStockThreshold ?? 0)
      ),
    [inventory]
  );

  return (
    <AppLayout title="Dashboard">
      <div className="metric-grid">
        <article className="metric-card">
          <span>Today&apos;s sales</span>
          <strong>RM {todaySales.toFixed(2)}</strong>
          <small>Average RM {avgOrder.toFixed(2)}</small>
        </article>
        <article className="metric-card">
          <span>Orders today</span>
          <strong>{todayOrders.length}</strong>
          <small>{todayOrders.length} orders saved</small>
        </article>
        <article className={`metric-card${lowStock.length ? " danger" : ""}`}>
          <span>Low stock items</span>
          <strong>{lowStock.length}</strong>
          <small>
            {lowStock.length
              ? lowStock.map((it) => it.name ?? it.id).join(", ")
              : "All stock OK"}
          </small>
        </article>
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-heading">
            <h3>Quick overview</h3>
          </div>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Use the sidebar to start a new order, review sales history, manage inventory, or show the QR payment screen.
          </p>
        </section>

        <section className="panel">
          <div className="section-heading">
            <h3>Quick actions</h3>
          </div>
          <button className="action-row" type="button" onClick={() => navigate("/")}>
            <span>Start new order</span>
            <strong>POS</strong>
          </button>
          <button className="action-row" type="button" onClick={() => navigate("/orders")}>
            <span>View sales history</span>
            <strong>RM {todaySales.toFixed(2)}</strong>
          </button>
          <button className="action-row" type="button" onClick={() => navigate("/inventory")}>
            <span>Check inventory</span>
            <strong>{lowStock.length} low</strong>
          </button>
          <button className="action-row" type="button" onClick={() => navigate("/qr")}>
            <span>Payment QR</span>
            <strong>Scan</strong>
          </button>
        </section>
      </div>
    </AppLayout>
  );
}

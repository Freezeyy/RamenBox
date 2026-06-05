import { useMemo, useState } from "react";
import "./styles.css";
import { useEffect } from "react";
import { db } from "./firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "./auth/AuthContext";
import AppLayout from "./components/AppLayout";

export default function Orders() {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      const snapshot = await getDocs(collection(db, "orders"));
      const ordersData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setOrders(ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    };

    fetchOrders();
  }, []);

  const deleteOrder = async (orderId) => {
    try {
      await deleteDoc(doc(db, "orders", orderId));
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return orders;
    return orders.filter((order) => {
      const text = [
        order.id,
        ...(order.items ?? []).map((i) => i.name),
        String(order.total),
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(q);
    });
  }, [orders, search]);

  const totalSales = orders.reduce((sum, o) => sum + Number(o.total), 0);

  const printReport = () => {
    const itemMap = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        const price =
          item.name === "Ramen" ? item.price - (order.discountApplied || 0) : item.price;

        const key =
          item.name === "Ramen" && order.discountApplied > 0
            ? `Ramen (RM${order.discountApplied} Off)`
            : item.name;

        if (!itemMap[key]) {
          itemMap[key] = { qty: 0, price };
        }
        itemMap[key].qty += 1;
      });
    });

    const reportWindow = window.open("", "_blank");
    reportWindow.document.write(`
      <html>
        <head>
          <title>Ramen Box Sales Report</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 10px; text-align: center; }
            th { background: #f5f5f5; }
            h1, h2 { text-align: center; }
          </style>
        </head>
        <body>
          <h1>Ramen Box Sales Report</h1>
          <h2>${new Date().toLocaleString()}</h2>
          <table>
            <tr><th>Item</th><th>Quantity</th><th>Unit Price (RM)</th><th>Total (RM)</th></tr>
            ${Object.entries(itemMap)
              .map(
                ([name, data]) => `
              <tr>
                <td>${name}</td>
                <td>${data.qty}</td>
                <td>${data.price.toFixed(2)}</td>
                <td>${(data.qty * data.price).toFixed(2)}</td>
              </tr>`
              )
              .join("")}
          </table>
          <h2>Total Sales: RM ${totalSales.toFixed(2)}</h2>
          <script>window.print();</script>
        </body>
      </html>
    `);
    reportWindow.document.close();
  };

  return (
    <AppLayout title="Sales History">
      <section className="panel">
        <div className="section-heading">
          <h3>Orders</h3>
          <button className="ghost-action" type="button" onClick={printReport}>
            Print PDF Report
          </button>
        </div>

        <div className="toolbar">
          <input
            className="field-input"
            type="search"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="order-history">
          {filtered.map((order, i) => (
            <article className="order-history-item" key={order.id}>
              <div className="order-history-line">
                <div>
                  <strong>Order #{orders.length - i}</strong>
                  {order.items.map((item, x) => {
                    const price =
                      item.name === "Ramen"
                        ? item.price - (order.discountApplied || 0)
                        : item.price;
                    return (
                      <div key={x}>
                        <small>
                          • {item.name} — RM {price.toFixed(2)}
                        </small>
                      </div>
                    );
                  })}
                  {order.discountApplied > 0 && (
                    <small>Discount: RM {order.discountApplied.toFixed(2)} (Ramen)</small>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>RM {Number(order.total).toFixed(2)}</strong>
                  {isAdmin && (
                    <div style={{ marginTop: 6 }}>
                      <button
                        className="delete-btn"
                        type="button"
                        onClick={() => deleteOrder(order.id)}
                      >
                        X
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
          {filtered.length === 0 && <p className="cart-empty">No orders found.</p>}
        </div>

        <div className="history-total">
          <span>Total Sales</span>
          <strong>RM {totalSales.toFixed(2)}</strong>
        </div>
      </section>
    </AppLayout>
  );
}

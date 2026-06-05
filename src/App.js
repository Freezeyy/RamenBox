import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "./firebase";
import { collection, doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore";
import ItemCard from "./components/ItemCard";
import AppLayout from "./components/AppLayout";
import "./styles.css";

const PRODUCTS = [
  { name: "Ramen", price: 6, image: "ramen.jpeg", inventoryId: "ramen", threshold: 10 },
  { name: "Sausage (2 pcs)", price: 1, image: "sausage.webp", inventoryId: "sausage", threshold: 10 },
  { name: "Egg", price: 0.5, image: "egg.webp", inventoryId: "egg", threshold: 5 },
  { name: "Meatball (4 pcs)", price: 2, image: "meatball.jpg", inventoryId: "meatball", threshold: 8 },
];

export default function App() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [stock, setStock] = useState({});
  const [thresholds, setThresholds] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadStock = async () => {
      const entries = await Promise.all(
        PRODUCTS.map(async (p) => {
          const ref = doc(db, "inventory", p.inventoryId);
          const snap = await getDoc(ref);
          const data = snap.data() ?? {};
          return [
            p.inventoryId,
            {
              qty: Number(data.quantity ?? 0),
              threshold: Number(data.lowStockThreshold ?? p.threshold),
            },
          ];
        })
      );
      setStock(Object.fromEntries(entries.map(([id, v]) => [id, v.qty])));
      setThresholds(Object.fromEntries(entries.map(([id, v]) => [id, v.threshold])));
    };

    loadStock().catch((e) => console.error("Failed to load inventory:", e));
  }, []);

  const stockFor = (item) => Number(stock?.[item.inventoryId] ?? 0);

  const addToCart = (item) => {
    if (stockFor(item) <= 0) {
      alert(`${item.name} is out of stock`);
      return;
    }
    setCart([...cart, item]);
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  const total = cart.reduce((sum, i) => {
    if (i.name === "Ramen") return sum + (i.price - discount);
    return sum + i.price;
  }, 0);

  const required = useMemo(() => {
    const counts = {};
    cart.forEach((it) => {
      counts[it.inventoryId] = (counts[it.inventoryId] ?? 0) + 1;
    });
    return counts;
  }, [cart]);

  const saveOrder = async () => {
    if (cart.length === 0) {
      alert("Please select at least one item");
      return;
    }
    if (saving) return;

    setSaving(true);

    const orderRef = doc(collection(db, "orders"));
    const order = {
      items: cart.map(({ name, price, image, inventoryId }) => ({ name, price, image, inventoryId })),
      discountApplied: discount,
      total: Number(total.toFixed(2)),
      createdAt: new Date().toISOString(),
      createdAtServer: serverTimestamp(),
    };

    try {
      await runTransaction(db, async (tx) => {
        for (const [inventoryId, qtyNeeded] of Object.entries(required)) {
          const invRef = doc(db, "inventory", inventoryId);
          const snap = await tx.get(invRef);
          const currentQty = Number(snap.data()?.quantity ?? 0);
          if (currentQty < qtyNeeded) {
            throw new Error(`OUT_OF_STOCK:${inventoryId}`);
          }
        }

        for (const [inventoryId, qtyNeeded] of Object.entries(required)) {
          const invRef = doc(db, "inventory", inventoryId);
          const snap = await tx.get(invRef);
          const currentQty = Number(snap.data()?.quantity ?? 0);
          tx.update(invRef, { quantity: currentQty - qtyNeeded, updatedAt: serverTimestamp() });
        }

        tx.set(orderRef, order);
      });

      setStock((prev) => {
        const next = { ...prev };
        Object.entries(required).forEach(([id, qty]) => {
          next[id] = Math.max(0, Number(next[id] ?? 0) - Number(qty));
        });
        return next;
      });

      setCart([]);
      setDiscount(0);
      navigate(`/payment/${orderRef.id}`);
    } catch (err) {
      const msg = String(err?.message ?? "");
      console.error("Failed to save order:", err);
      if (msg.startsWith("OUT_OF_STOCK:")) {
        const id = msg.replace("OUT_OF_STOCK:", "");
        const product = PRODUCTS.find((p) => p.inventoryId === id);
        alert(`${product?.name ?? id} is out of stock`);
      } else {
        alert("Failed to save order. Try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Ramen POS">
      <div className="order-layout">
        <section className="menu-list">
          {PRODUCTS.map((p) => (
            <ItemCard
              key={p.inventoryId}
              name={p.name}
              price={p.price}
              image={p.image}
              stock={stockFor(p)}
              threshold={thresholds[p.inventoryId] ?? p.threshold}
              onAdd={() => addToCart(p)}
            />
          ))}
        </section>

        <aside className="order-summary">
          <div className="section-heading">
            <h3>Current Selection</h3>
            <button className="ghost-action" type="button" onClick={clearCart}>
              Clear
            </button>
          </div>

          <div className="cart-list">
            {cart.length === 0 ? (
              <p className="cart-empty">No items selected yet.</p>
            ) : (
              cart.map((c, i) => (
                <div className="cart-item" key={i}>
                  <span>{c.name}</span>
                  <span>RM {c.price}</span>
                </div>
              ))
            )}
          </div>

          {cart.some((i) => i.name === "Ramen") && (
            <div className="coupon-box">
              <span>Apply coupon (Ramen)</span>
              <div className="segmented">
                {[0, 0.5, 1].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={discount === d ? "is-active" : ""}
                    onClick={() => setDiscount(d)}
                  >
                    {d === 0 ? "None" : `RM${d}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="total-line">
            <span>Total</span>
            <strong>RM {total.toFixed(2)}</strong>
          </div>

          <button className="primary-action" type="button" onClick={saveOrder} disabled={saving}>
            {saving ? "Saving..." : "Save Order"}
          </button>
          <button className="secondary-action" type="button" onClick={() => navigate("/qr")}>
            Payment QR
          </button>
          <button className="ghost-action" type="button" onClick={() => navigate("/orders")}>
            View All Orders
          </button>
        </aside>
      </div>
    </AppLayout>
  );
}

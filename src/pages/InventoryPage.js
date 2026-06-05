import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../auth/AuthContext";
import { INVENTORY_DOCS } from "../inventory/inventoryConfig";
import AppLayout from "../components/AppLayout";
import "../styles.css";

export default function InventoryPage() {
  const { role, isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ensure = async () => {
      await Promise.all(
        INVENTORY_DOCS.map((it) =>
          setDoc(
            doc(db, "inventory", it.id),
            {
              name: it.name,
              quantity: 0,
              lowStockThreshold: it.lowStockThreshold,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          )
        )
      );
    };

    ensure().catch((e) => console.error("Failed to ensure inventory docs:", e));
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "inventory"), (snap) => {
      const rows = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => String(a.name ?? a.id).localeCompare(String(b.name ?? b.id)));
      setItems(rows);
      setDraft((prev) => {
        if (Object.keys(prev).length > 0) return prev;
        const initial = {};
        rows.forEach((r) => {
          initial[r.id] = {
            quantity: Number(r.quantity ?? 0),
            lowStockThreshold: Number(r.lowStockThreshold ?? 0),
          };
        });
        return initial;
      });
    });

    return () => unsub();
  }, []);

  const lowStock = useMemo(() => {
    return items.filter((it) => Number(it.quantity ?? 0) <= Number(it.lowStockThreshold ?? 0));
  }, [items]);

  const onChange = (id, key, value) => {
    setDraft((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [key]: value },
    }));
  };

  const save = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      for (const [id, data] of Object.entries(draft)) {
        const quantity = Math.max(0, Number(data.quantity ?? 0));
        const lowStockThreshold = Math.max(0, Number(data.lowStockThreshold ?? 0));
        await updateDoc(doc(db, "inventory", id), {
          quantity,
          lowStockThreshold,
          updatedAt: serverTimestamp(),
        });
      }
      alert("Inventory saved.");
    } catch (e) {
      console.error("Failed to save inventory:", e);
      alert("Failed to save inventory. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout title="Inventory">
      <section className="panel">
        <div className="section-heading">
          <h3>Inventory Management</h3>
          {isAdmin ? (
            <button
              className="primary-action"
              type="button"
              style={{ width: "auto", marginTop: 0 }}
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          ) : (
            <span className="pill">View only · {role}</span>
          )}
        </div>

        {lowStock.length > 0 && (
          <div className="alert-strip" style={{ marginBottom: 14 }}>
            <strong>Low stock</strong>
            <span>
              {lowStock.map((it) => `${it.name ?? it.id} (${Number(it.quantity ?? 0)})`).join(", ")}
            </span>
          </div>
        )}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Low threshold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const q = Number(draft[it.id]?.quantity ?? it.quantity ?? 0);
                const t = Number(draft[it.id]?.lowStockThreshold ?? it.lowStockThreshold ?? 0);
                const isLow = q <= t;

                return (
                  <tr key={it.id}>
                    <td>
                      <b>{it.name ?? it.id}</b>
                    </td>
                    <td>
                      <input
                        className="qty-input"
                        type="number"
                        min={0}
                        value={Number.isFinite(q) ? q : 0}
                        disabled={!isAdmin}
                        onChange={(e) => onChange(it.id, "quantity", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="qty-input"
                        type="number"
                        min={0}
                        value={Number.isFinite(t) ? t : 0}
                        disabled={!isAdmin}
                        onChange={(e) => onChange(it.id, "lowStockThreshold", e.target.value)}
                      />
                    </td>
                    <td>
                      <span className={`pill${isLow ? " low" : ""}`}>{isLow ? "LOW" : "OK"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </AppLayout>
  );
}

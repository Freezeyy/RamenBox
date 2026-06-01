import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import ItemCard from "./components/ItemCard";
import "./styles.css";

export default function App() {
  const navigate = useNavigate();

  const products = [
    { name: "Ramen", price: 6, image: "ramen.jpeg" },
    { name: "Sausage (2 pcs)", price: 1, image: "sausage.webp" },
    { name: "Egg", price: 0.5, image: "egg.webp" },
    { name: "Meatball (4 pcs)", price: 2, image: "meatball.jpg" },
  ];

  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0); // discount for Ramen

  const addToCart = (item) => setCart([...cart, item]);

  // calculate total with discount
  const total = cart.reduce((sum, i) => {
    if (i.name === "Ramen") return sum + (i.price - discount);
    return sum + i.price;
  }, 0);


const saveOrder = async () => {
  if (cart.length === 0) return;

  const order = {
    items: cart,
    discountApplied: discount,
    total: Number(total.toFixed(2)),
    createdAt: new Date().toISOString(),
  };

  try {
    try {
      // Save order to Firebase and get the doc ID
      const docRef = await addDoc(collection(db, "orders"), order);

      // Reset cart and discount
      setCart([]);
      setDiscount(0);

      // Navigate to payment page for this specific order
      navigate(`/payment/${docRef.id}`);
    } catch (err) {
      console.error("Failed to save order:", err);
      alert("Failed to save order. Try again.");
    }
  } catch (err) {
    console.error("Failed to save order:", err);
    alert("Failed to save order. Try again.");
  }
};

  return (
    <div className="container">
      <div className="header">Ramen POS</div>

      <div className="grid">
        {products.map((p, i) => (
          <ItemCard
            key={i}
            name={p.name}
            price={p.price}
            image={p.image}
            onClick={() => addToCart(p)}
          />
        ))}
      </div>

      {/* Cart Section */}
      <div style={{ marginTop: 25 }}>
        <h3>Current Selection:</h3>
        {cart.length === 0 ? <p>No items yet</p> : (
          <ul>
            {cart.map((c, i) => (
              <li key={i}>{c.name} — RM {c.price}</li>
            ))}
          </ul>
        )}

        {/* Discount Selector for Ramen */}
        {cart.some(i => i.name === "Ramen") && (
  <div style={{ marginTop: 10 }}>
    <label style={{ fontWeight: "bold" }}>Apply Coupon:</label>
    <div style={{ marginTop: 6, display: "flex", gap: "10px" }}>
      {[0, 0.5, 1].map((d) => (
        <button
          key={d}
          onClick={() => setDiscount(d)}
          style={{
            padding: "6px 12px",
            borderRadius: "8px",
            border: discount === d ? "2px solid #222" : "1px solid #ccc",
            background: discount === d ? "#222" : "#fff",
            color: discount === d ? "#fff" : "#222",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {d === 0 ? "No Discount" : `RM${d} Off`}
        </button>
      ))}
    </div>
  </div>
)}


        <h3>Total: RM {total.toFixed(2)}</h3>
      </div>

      <button className="button" onClick={saveOrder}>
        Save Order
      </button>

      <button className="button" onClick={() => navigate("/qr")}>
        Payment QR
      </button>

      <button className="button" onClick={() => navigate("/orders")}>
        View All Orders
      </button>
    </div>
  );
}

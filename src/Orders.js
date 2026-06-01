import { useNavigate } from "react-router-dom";
import "./styles.css";
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";


export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const snapshot = await getDocs(collection(db, "orders"));
      const ordersData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Newest first
      setOrders(ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    };

    fetchOrders();
  }, []);

  const deleteOrder = async (orderId) => {
    try {
      await deleteDoc(doc(db, "orders", orderId));
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  };

  const totalSales = orders.reduce((sum, o) => sum + Number(o.total), 0);


  const printReport = () => {
  const itemMap = {};

  orders.forEach(order => {
    order.items.forEach(item => {
      const price =
        item.name === "Ramen"
          ? item.price - (order.discountApplied || 0)
          : item.price;

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
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Unit Price (RM)</th>
            <th>Total (RM)</th>
          </tr>
          ${Object.entries(itemMap)
            .map(
              ([name, data]) => `
              <tr>
                <td>${name}</td>
                <td>${data.qty}</td>
                <td>${data.price.toFixed(2)}</td>
                <td>${(data.qty * data.price).toFixed(2)}</td>
              </tr>
            `
            )
            .join("")}
        </table>

        <h2>Total Sales: RM ${totalSales.toFixed(2)}</h2>

        <script>
          window.print();
        </script>
      </body>
    </html>
  `);
  reportWindow.document.close();
};


  return (
    <div className="container">
      <div className="header">Orders</div>

{orders.map((order, i) => (

  <div className="order-row" key={i}>
    <div>
      Order #{orders.length - i} {/* optional: show order number descending */}
      {order.items.map((item, x) => {
        let price = item.name === "Ramen" 
          ? item.price - (order.discountApplied || 0) 
          : item.price;
        return <div key={x}>• {item.name} — RM {price.toFixed(2)}</div>;
      })}
      {order.discountApplied > 0 && (
        <div>Discount Applied: RM {order.discountApplied.toFixed(2)} (Ramen)</div>
      )}
<b>Total: RM {Number(order.total).toFixed(2)}</b>

    </div>
    <button className="delete-btn" onClick={() => deleteOrder(order.id)}>X</button>
  </div>
))}

      <h2>Total Sales: RM {totalSales.toFixed(2)}</h2>

      <button
  className="button"
  onClick={printReport}
  style={{ background: "#007bff" }}
>
  Print PDF Report
</button>


      <button className="button" onClick={() => navigate("/")}>
        Back
      </button>
    </div>
  );
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Orders from "./Orders";
import QRPage from "./QRPage";
import PaymentPage from "./PaymentPage";
import { useParams } from "react-router-dom";

import { useEffect, useState } from "react";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";


const root = ReactDOM.createRoot(document.getElementById('root'));

function PaymentPageWrapper() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const docSnap = await getDoc(doc(db, "orders", orderId));
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("No such order!");
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (!order) return <p style={{textAlign:"center", padding:30}}>Loading order...</p>;
  return <PaymentPage order={order} />;
}


root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/payment/:orderId" element={<PaymentPageWrapper />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/qr" element={<QRPage />} />
    </Routes>
  </BrowserRouter>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

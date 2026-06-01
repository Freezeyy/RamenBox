import { useNavigate } from "react-router-dom";

export default function QRPage() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", padding: 50 }}>
      <h2>Scan to Pay</h2>
      <img 
        src="/images/qr-code.jpeg" 
        alt="Payment QR" 
        style={{ width: 800, height: 1000, margin: 20 }} 
      />
      <br />
      <button 
        onClick={() => navigate("/")} 
        style={{
          padding: "12px 20px",
          fontSize: "16px",
          borderRadius: "10px",
          background: "#222",
          color: "white",
          cursor: "pointer"
        }}
      >
        Back to Cashier
      </button>
    </div>
  );
}

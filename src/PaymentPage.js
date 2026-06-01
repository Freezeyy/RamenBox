import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function PaymentPage({ order }) {
    const navigate = useNavigate();
    const [paymentType, setPaymentType] = useState(""); // "cash" or "qr"
    const [cashPaid, setCashPaid] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [balance, setBalance] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);


  const total = order.total;

  // Handle numeric keypad clicks
    const handleKeypad = (value) => {
    if (value === "C") {
        setCashPaid("");
    } else if (value === "←") {
        setCashPaid(cashPaid.slice(0, -1));
    } else if (value === ".") {
        if (!cashPaid.includes(".")) setCashPaid(cashPaid + value);
    } else {
        setCashPaid(cashPaid + value);
    }
    };


    const handleCashSubmit = () => {
    const paid = parseFloat(cashPaid);
    if (isNaN(paid) || paid < total) {
        setPaidAmount(0);
        setBalance(0);
        setShowPopup(true);
        return;
    }
    setPaidAmount(paid);
    setBalance((paid - total).toFixed(2));
    setShowPopup(true);
    };

  const goToQR = () => navigate("/qr");

    const keypadButtons = [
    "1", "2", "3",
    "4", "5", "6",
    "7", "8", "9",
    ".", "0", "←",
    "C"
    ];

  return (
    <div style={{ textAlign: "center", padding: 30, maxWidth: 400, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 20 }}>Select Payment Method</h2>

      {!paymentType && (
        <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
          <button style={buttonStyle} onClick={() => setPaymentType("cash")}>Cash</button>
          <button style={buttonStyle} onClick={() => setPaymentType("qr")}>QR Payment</button>
        </div>
      )}

      {paymentType === "cash" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 28, fontWeight: "bold", marginBottom: 10 }}>
            Total: RM {total.toFixed(2)}
          </div>
          <input
            type="text"
            value={cashPaid}
            readOnly
            placeholder="Enter cash paid"
            style={{
              width: "100%",
              fontSize: 32,
              padding: "10px",
              textAlign: "center",
              borderRadius: 12,
              border: "2px solid #222",
              marginBottom: 20
            }}
          />

          {/* Numeric Keypad */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10
          }}>
            {keypadButtons.map((k, i) => (
              <button
                key={i}
                onClick={() => handleKeypad(k)}
                style={{
                  padding: 20,
                  fontSize: 24,
                  borderRadius: 12,
                  background: "#222",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                {k}
              </button>
            ))}
          </div>

          <button
            onClick={handleCashSubmit}
            style={{
              marginTop: 20,
              padding: "12px 20px",
              fontSize: 20,
              borderRadius: 12,
              background: "#28a745",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              width: "100%"
            }}
          >
            Submit Cash
          </button>
        </div>
      )}

      {paymentType === "qr" && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={goToQR}
            style={{
              padding: "12px 20px",
              fontSize: 20,
              borderRadius: 12,
              background: "#007bff",
              color: "#fff",
              border: "none",
              cursor: "pointer"
            }}
          >
            Go to QR Payment
          </button>
        </div>
      )}

    {showPopup && (
        <div style={popupOverlayStyle}>
            <div style={popupStyle}>
            {paidAmount === 0 ? (
                <p style={{ fontSize: 20 }}>Amount must be at least RM {total.toFixed(2)}</p>
            ) : (
                <div style={{ fontSize: 20 }}>
                <p>Customer paid: RM {paidAmount}</p>
                <p>Balance: RM {balance}</p>
                </div>
            )}
            <button
                onClick={() => {
                setShowPopup(false);
                if (paidAmount > 0) navigate("/"); // back to cashier after successful payment
                }}
                style={{
                marginTop: 20,
                padding: "10px 16px",
                fontSize: 18,
                borderRadius: 10,
                background: "#28a745",
                color: "#fff",
                border: "none",
                cursor: "pointer"
                }}
            >
                OK
            </button>
            </div>
        </div>
    )}


      <button
        style={{ marginTop: 20, padding: "10px 16px", borderRadius: 10 }}
        onClick={() => navigate("/")}
      >
        Cancel / Back
      </button>
    </div>
  );
}

// Reusable button style for Cash / QR selection
const buttonStyle = {
  padding: "12px 20px",
  fontSize: 20,
  borderRadius: 12,
  background: "#222",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  minWidth: 120
};

const popupOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000
};

const popupStyle = {
  background: "#fff",
  padding: 30,
  borderRadius: 16,
  minWidth: 250,
  textAlign: "center",
  boxShadow: "0 4px 10px rgba(0,0,0,0.25)"
};


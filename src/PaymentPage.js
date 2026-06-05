import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import "./styles.css";

export default function PaymentPage({ order }) {
  const navigate = useNavigate();
  const [paymentType, setPaymentType] = useState("cash");
  const [cashPaid, setCashPaid] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [balance, setBalance] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  const total = order.total;

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

  const keypadButtons = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "←", "C"];

  return (
    <AppLayout title="Payment">
      <div className="payment-wrap">
        <div className="section-heading" style={{ justifyContent: "center" }}>
          <h3>Select Payment Method</h3>
          <span className="pill">Total: RM {total.toFixed(2)}</span>
        </div>

        <div className="payment-methods">
          <button
            type="button"
            className={paymentType === "cash" ? "is-active" : ""}
            onClick={() => setPaymentType("cash")}
          >
            Cash
          </button>
          <button
            type="button"
            className={paymentType === "qr" ? "is-active" : ""}
            onClick={() => setPaymentType("qr")}
          >
            QR Payment
          </button>
        </div>

        {paymentType === "cash" && (
          <>
            <output className="cash-display">{cashPaid || "0"}</output>
            <div className="keypad">
              {keypadButtons.map((k) => (
                <button key={k} type="button" onClick={() => handleKeypad(k)}>
                  {k}
                </button>
              ))}
            </div>
            <button className="primary-action" type="button" onClick={handleCashSubmit}>
              Submit Cash
            </button>
          </>
        )}

        {paymentType === "qr" && (
          <button className="primary-action" type="button" onClick={() => navigate("/qr")}>
            Go to QR Payment
          </button>
        )}

        <button className="ghost-action" type="button" onClick={() => navigate("/")}>
          Cancel / Back
        </button>
      </div>

      {showPopup && (
        <div className="payment-popup-overlay">
          <div className="payment-popup">
            {paidAmount === 0 ? (
              <p>Amount must be at least RM {total.toFixed(2)}</p>
            ) : (
              <>
                <p>Customer paid: RM {paidAmount}</p>
                <p>Balance: RM {balance}</p>
              </>
            )}
            <button
              className="primary-action"
              type="button"
              onClick={() => {
                setShowPopup(false);
                if (paidAmount > 0) navigate("/");
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

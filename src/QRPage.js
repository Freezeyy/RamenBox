import { useNavigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import "./styles.css";

export default function QRPage() {
  const navigate = useNavigate();

  return (
    <AppLayout title="QR Payment">
      <section className="qr-screen">
        <div className="qr-copy">
          <p className="eyebrow">Static scan-to-pay</p>
          <h3>Scan to Pay</h3>
          <p>Show this screen to the customer when they select QR payment.</p>
          <button className="secondary-action" type="button" onClick={() => navigate("/")}>
            Back to Cashier
          </button>
        </div>
        <div className="qr-frame">
          <img src="/images/qr-code.jpeg" alt="Payment QR code" />
        </div>
      </section>
    </AppLayout>
  );
}

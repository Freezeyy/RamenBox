export default function ItemCard({ name, price, image, stock, threshold, onAdd }) {
  const qty = Number(stock ?? 0);
  const isOut = qty <= 0;
  const isLow = !isOut && qty <= Number(threshold ?? 5);
  const statusClass = isOut ? "out" : isLow ? "low" : "";
  const statusText = isOut ? "Out" : isLow ? "Low" : "OK";

  return (
    <article className="menu-card">
      <img src={`/images/${image}`} alt={name} />
      <div className="menu-card-body">
        <div className="menu-title">
          <h3>{name}</h3>
          <span className="price">RM {price}</span>
        </div>
        <div className="status-row">
          <span className={`pill ${statusClass}`}>
            {statusText} · stock: {qty}
          </span>
          <button
            type="button"
            className="add-button"
            disabled={isOut}
            onClick={onAdd}
          >
            Add
          </button>
        </div>
      </div>
    </article>
  );
}

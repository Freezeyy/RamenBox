export default function ItemCard({ name, price, image, onClick }) {
  return (
    <div className="card" onClick={onClick}>
      <img src={`/images/${image}`} alt={name} />
      <div><b>{name}</b></div>
      <div>RM {price}</div>
    </div>
  );
}

export default function Repeater({ title, items, setItems, make, render }) {
  const update = (i, key, v) => setItems(items.map((it, idx) => (idx === i ? { ...it, [key]: v } : it)));
  return (
    <div>
      {items.map((it, i) => (
        <div className="item" key={i}>
          <div className="item-top">
            <span>{title} {i + 1}</span>
            {items.length > 1 && (
              <button type="button" className="btn small" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>
                Remove
              </button>
            )}
          </div>
          {render(it, (key, v) => update(i, key, v))}
        </div>
      ))}
      <button type="button" className="btn" onClick={() => setItems([...items, make()])}>
        Add another {title.toLowerCase()}
      </button>
    </div>
  );
}

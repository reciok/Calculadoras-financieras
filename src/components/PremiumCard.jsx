export default function PremiumCard({ title, children }) {
  return (
    <section className="content-card">
      {title ? <h3 className="section-title">{title}</h3> : null}
      {children}
    </section>
  );
}

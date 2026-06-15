export default function GlobalShell({ children }) {
  return (
    <div className="global-shell">
      <nav>{/* Global navigation */}</nav>
      <main>{children}</main>
    </div>
  );
}

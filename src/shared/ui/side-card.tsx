/** The boxes in a page's side column (share link, CR actions, client). */
export function SideCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-3 rounded-xl border bg-canvas p-5">{children}</div>
  );
}

export function SideCardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold">{children}</h2>;
}

export function SideCardText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm leading-relaxed text-pretty text-muted-foreground">
      {children}
    </p>
  );
}

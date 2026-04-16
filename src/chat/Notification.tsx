import { useState } from "react";

interface NotificationItem {
  id: number;
  message: string;
}

let nextId = 0;

export function useNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const notify = (message: string) => {
    const id = nextId++;
    setItems((prev) => [...prev.slice(-2), { id, message }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  };

  return { items, notify };
}

export function NotificationStack({ items }: { items: NotificationItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2">
      {items.map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto animate-in fade-in slide-in-from-right-4 rounded-lg border border-border bg-card px-4 py-2 text-sm text-card-foreground shadow-xs"
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import {
  ShoppingCart,
  Package,
  Tags,
  ArrowLeftRight,
  Wallet,
  ReceiptText,
  ListOrdered,
  Store,
} from "lucide-react";

const items = [
  { to: "/punto-venta", label: "Terminal", icon: ShoppingCart, end: true },
  { to: "/pos-productos", label: "Productos", icon: Package },
  { to: "/pos-categorias", label: "Categorías", icon: Tags },
  { to: "/pos-movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { to: "/pos-caja", label: "Caja diaria", icon: Wallet },
  { to: "/pos-ventas", label: "Ventas", icon: ReceiptText },
  { to: "/pos-pedidos", label: "Pedidos", icon: ListOrdered },
  { to: "/pos-online", label: "Tienda Online", icon: Store },
];

export function PosNav() {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 mb-4 border-b">
      {items.map(({ to, label, icon: Icon, end }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: end }}
          inactiveProps={{ className: "text-muted-foreground hover:text-foreground hover:bg-muted" }}
          activeProps={{
            className: "bg-primary/10 text-primary font-medium",
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors"
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </div>
  );
}

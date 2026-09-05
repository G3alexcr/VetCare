import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoney, useCurrency } from "@/lib/config-store";
import {
  PAYMENT_METHODS,
  TAX_RATE,
  addPosOrder,
  getOpenSession,
  usePosCategories,
  usePosProducts,
  type PaymentMethod,
  type PosOrderStatus,
} from "@/lib/pos-store";
import { ShoppingCart, Store, Plus, Minus, Trash2, X, Package, Search, ArrowLeft } from "lucide-react";
import { usePortalAuth } from "@/lib/portal-auth";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/tienda")({
  head: () => ({ meta: [{ title: "Tienda Online — VetCare" }] }),
  component: TiendaOnline,
});

type CartLine = { productId: string; name: string; unitPrice: string; quantity: number; image?: string };
type Confirmed = { number: string; total: number } | null;

function TiendaOnline() {
  const navigate = useNavigate();
  const { owner } = usePortalAuth();
  const { user } = useAuth();
  const products = usePosProducts();
  const categories = usePosCategories();
  const currency = useCurrency();

  const returnTarget = owner ? "/portal/dashboard" : user ? "/dashboard" : "/portal/dashboard";
  const returnLabel = owner ? "Volver a Inicio" : user ? "Volver al Panel" : "Volver a mi app";

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("todas");
  const [sort, setSort] = useState("nombre");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Efectivo");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState<Confirmed>(null);

  const catalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = products.filter((p) => p.online && p.estado === "Activo" && (cat === "todas" || p.categoryId === cat) && (!q || [p.name, p.code, p.barcode].some((x) => (x || "").toLowerCase().includes(q))));
    if (sort === "nombre") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === "menor") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "mayor") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, query, cat, sort]);

  const addToCart = (p: (typeof products)[number]) => {
    if (p.stock <= 0) return toast.error("Producto agotado");
    setCart((c) => {
      const ex = c.find((l) => l.productId === p.id);
      if (ex) return c.map((l) => (l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l));
      return [...c, { productId: p.id, name: p.name, unitPrice: String(p.price), quantity: 1, image: p.image }];
    });
  };
  const setQty = (id: string, q: number) => setCart((c) => c.map((l) => (l.productId === id ? { ...l, quantity: Math.max(1, q) } : l)));
  const remove = (id: string) => setCart((c) => c.filter((l) => l.productId !== id));

  const subtotal = cart.reduce((a, l) => a + Number(l.unitPrice) * l.quantity, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax;

  const checkout = () => {
    if (cart.length === 0) return;
    if (!clientName.trim()) return toast.error("Ingresa tu nombre");
    const order = addPosOrder({
      clientName: clientName.trim(),
      items: cart.map((l) => ({ id: `oi_${Date.now()}`, productId: l.productId, name: l.name, quantity: l.quantity, unitPrice: Number(l.unitPrice) })),
      total,
      status: "Pendiente" as PosOrderStatus,
      notes: notes || "Pedido realizado en la tienda online.",
      source: "online",
    });
    setConfirmed({ number: order.number, total: order.total });
    setCart([]);
    setClientName("");
    setNotes("");
    setCartOpen(false);
  };

  const catColor = (id: string) => categories.find((c) => c.id === id)?.color ?? "bg-slate-100 text-slate-700";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur shadow-2xs safe-top">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-9 px-3 gap-1.5 font-semibold rounded-xl border-border/80 hover:bg-muted shrink-0 shadow-2xs"
            >
              <Link to={returnTarget}>
                <ArrowLeft className="h-4 w-4 text-emerald-600" />
                <span className="hidden sm:inline">{returnLabel}</span>
                <span className="sm:hidden">Volver</span>
              </Link>
            </Button>

            <div className="h-5 w-px bg-border/60 hidden sm:block" />

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white grid place-items-center shrink-0 shadow-xs">
                <Store className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm sm:text-base leading-tight truncate">
                  VetCare · Tienda y Farmacia
                </div>
                <div className="text-[11px] text-muted-foreground leading-tight truncate hidden xs:block">
                  Pedidos vinculados al punto de venta
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!getOpenSession() && (
              <Badge variant="outline" className="hidden md:inline-flex text-xs bg-muted/40">
                Pendiente de aviso
              </Badge>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={() => setCartOpen(true)}
              className="relative h-9 px-3 font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <ShoppingCart className="h-4 w-4 mr-1.5" />
              Carrito
              {cart.reduce((a, l) => a + l.quantity, 0) > 0 && (
                <Badge className="ml-1.5 h-5 min-w-5 px-1 bg-white text-emerald-700 hover:bg-white font-bold">
                  {cart.reduce((a, l) => a + l.quantity, 0)}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Buscar / ordenar */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar producto por nombre o código..." className="pl-9" />
          </div>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nombre">Ordenar por nombre</SelectItem>
              <SelectItem value="menor">Precio: menor a mayor</SelectItem>
              <SelectItem value="mayor">Precio: mayor a menor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Categorías */}
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setCat("todas")} className={`px-3 py-1.5 rounded-md text-xs font-medium ${cat === "todas" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>Todas</button>
          {categories.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`px-3 py-1.5 rounded-md text-xs font-medium ${cat === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{c.nombre}</button>
          ))}
        </div>

        {/* Productos */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {catalog.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="aspect-square bg-muted flex items-center justify-center">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="h-10 w-10 text-muted-foreground/50" />
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold leading-tight">{p.name}</div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${catColor(p.categoryId)}`}>{categories.find((c) => c.id === p.categoryId)?.nombre ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold">{formatMoney(p.price, currency)}</div>
                  <span className={`text-xs ${p.stock <= 0 ? "text-rose-600 font-medium" : "text-muted-foreground"}`}>{p.stock <= 0 ? "Agotado" : `Stock: ${p.stock}`}</span>
                </div>
                <Button className="w-full" disabled={p.stock <= 0} onClick={() => addToCart(p)}><Plus className="h-4 w-4 mr-1" /> Agregar</Button>
              </div>
            </Card>
          ))}
          {catalog.length === 0 && <div className="col-span-full text-center text-muted-foreground py-10">No hay productos disponibles.</div>}
        </div>
      </main>

      {/* Carrito / checkout */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Tu carrito</DialogTitle></DialogHeader>
          {cart.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">Tu carrito está vacío.</div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                {cart.map((l) => (
                  <div key={l.productId} className="flex items-center gap-2 text-sm">
                    <div className="flex-1 min-w-0"><div className="truncate font-medium">{l.name}</div><div className="text-xs text-muted-foreground">{formatMoney(Number(l.unitPrice), currency)} c/u</div></div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setQty(l.productId, l.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                      <input value={l.quantity} onChange={(e) => setQty(l.productId, Number(e.target.value) || 1)} className="w-10 text-center text-sm border rounded h-7" />
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setQty(l.productId, l.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                    <div className="w-16 text-right font-medium whitespace-nowrap">{formatMoney(Number(l.unitPrice) * l.quantity, currency)}</div>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => remove(l.productId)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatMoney(subtotal, currency)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IVA</span><span>{formatMoney(tax, currency)}</span></div>
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatMoney(total, currency)}</span></div>
              </div>
              <div className="space-y-2 pt-1">
                <div className="space-y-1.5"><Label>Tu nombre (Dueño)</Label><Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ej: María Rodríguez" /></div>
                <div className="space-y-1.5">
                  <Label>Método de pago</Label>
                  <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label>Notas (opcional)</Label><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Indicaciones para tu pedido" /></div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCartOpen(false)}><X className="h-4 w-4 mr-1" /> Cerrar</Button>
            <Button disabled={cart.length === 0} onClick={checkout}>Realizar pedido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación */}
      <Dialog open={confirmed != null} onOpenChange={(o) => { if (!o) setConfirmed(null); }}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader><DialogTitle className="text-emerald-600">¡Pedido recibido! 🎉</DialogTitle></DialogHeader>
          {confirmed && (
            <div className="space-y-2 text-sm">
              <p>Tu pedido <strong>{confirmed.number}</strong> fue registrado. La clínica lo preparará y te contactará para coordinar la entrega o el pago.</p>
              <div className="flex justify-between text-muted-foreground"><span>Total a pagar</span><span className="font-bold text-foreground">{formatMoney(confirmed.total, currency)}</span></div>
              <Button className="w-full mt-2" onClick={() => setConfirmed(null)}>Listo</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

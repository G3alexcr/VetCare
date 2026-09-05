import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout } from "@/components/app-layout";
import { PosNav } from "@/components/pos-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatMoney, useCurrency } from "@/lib/config-store";
import { usePlanCapabilities } from "@/lib/saas-store";
import { PlanGate } from "@/components/plan-gate";
import {
  PAYMENT_METHODS,
  TAX_RATE,
  confirmPosSale,
  getCategoryColor,
  getOpenSession,
  isLowStock,
  usePosCategories,
  usePosKpis,
  usePosProducts,
  type PaymentMethod,
} from "@/lib/pos-store";
import { ShoppingCart, Plus, Minus, Trash2, Banknote, Search, ScanBarcode, Printer, X, TriangleAlert, Package } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/punto-venta")({ component: PuntoVentaPage });

type CartLine = { productId: string; name: string; unitPrice: number; stock: number; quantity: number; discount: number };
type Receipt = { number: string; items: { name: string; quantity: number; unitPrice: number; lineTotal: number }[]; subtotal: number; discount: number; tax: number; total: number; received: number; change: number; method: PaymentMethod } | null;

function PuntoVentaPage() {
  const caps = usePlanCapabilities();
  const products = usePosProducts();
  const categories = usePosCategories();
  const currency = useCurrency();
  const kpis = usePosKpis();
  if (!caps.posEnabled) return <AppLayout><PlanGate planKey="pos" /></AppLayout>;

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("todas");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receipt, setReceipt] = useState<Receipt>(null);
  const [method, setMethod] = useState<PaymentMethod>("Efectivo");
  const [received, setReceived] = useState<number | undefined>(undefined);
  const [clientName, setClientName] = useState("");

  const catalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => p.estado === "Activo" && (cat === "todas" || p.categoryId === cat) && (!q || [p.name, p.code, p.barcode].some((x) => (x || "").toLowerCase().includes(q))));
  }, [products, query, cat]);

  const addToCart = (p: (typeof products)[number]) => {
    setCart((c) => {
      const existing = c.find((l) => l.productId === p.id);
      if (existing) {
        if (existing.quantity + 1 > p.stock) { toast.error("Stock insuficiente"); return c; }
        return c.map((l) => (l.productId === p.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      if (p.stock <= 0) { toast.error("Producto sin stock"); return c; }
      return [...c, { productId: p.id, name: p.name, unitPrice: p.price, stock: p.stock, quantity: 1, discount: 0 }];
    });
  };
  const setQty = (productId: string, qty: number) => {
    setCart((c) => c.map((l) => (l.productId === productId ? { ...l, quantity: Math.max(1, qty) } : l)));
  };
  const removeLine = (productId: string) => setCart((c) => c.filter((l) => l.productId !== productId));

  const subtotal = cart.reduce((a, l) => a + l.unitPrice * l.quantity - l.discount, 0);
  const taxable = Math.max(subtotal - discount, 0);
  const tax = Math.round(taxable * TAX_RATE);
  const total = taxable + tax;

  const doCheckout = () => {
    if (cart.length === 0) return;
    if (discount < 0 || discount > subtotal) return toast.error("Descuento inválido");
    const sale = confirmPosSale({ items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity, discount: l.discount })), discount, paymentMethod: method, received, clientName });
    if (!sale) return toast.error("No se pudo completar la venta");
    const change = received != null ? Math.max(received - sale.total, 0) : 0;
    setReceipt({ number: sale.number, items: sale.items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice, lineTotal: i.unitPrice * i.quantity - i.discount })), subtotal: sale.subtotal, discount: sale.discount, tax: sale.tax, total: sale.total, received: received ?? sale.total, change, method: sale.paymentMethod });
    setCart([]);
    setDiscount(0);
    setReceived(undefined);
    setClientName("");
    setCheckoutOpen(false);
    toast.success(`Venta ${sale.number} registrada`);
  };

  const openCheckout = () => { setCheckoutOpen(true); setReceived(total); };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="h-6 w-6 text-primary" /> Punto de Venta</h1>
            <p className="text-muted-foreground text-sm mt-1">Vende rápido: busca, agrega al carrito y cobra.</p>
          </div>
          {!getOpenSession() && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <TriangleAlert className="h-3.5 w-3.5 mr-1" /> Caja no abierta
            </Badge>
          )}
        </div>

        <PosNav />

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          {/* Catálogo */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, código o barras..." className="pl-9" />
              </div>
              <Button variant="ghost" size="icon" title="Escanear código de barras"><ScanBarcode className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setCat("todas")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${cat === "todas" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>Todas</button>
              {categories.map((c) => (
                <button key={c.id} onClick={() => setCat(c.id)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${cat === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{c.nombre}</button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {catalog.map((p) => (
                <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock <= 0} className="text-left border rounded-xl p-3 hover:shadow-md hover:border-primary/40 transition disabled:opacity-50 disabled:cursor-not-allowed">
                  <div className="aspect-square w-full rounded-lg overflow-hidden bg-muted mb-2 grid place-items-center">
                    {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <Package className="h-8 w-8 text-muted-foreground/40" />}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm leading-tight">{p.name}</div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${getCategoryColor(p.categoryId)}`}>{categories.find((c) => c.id === p.categoryId)?.nombre ?? "—"}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold">{formatMoney(p.price, currency)}</span>
                    <span className={`text-xs ${isLowStock(p) ? "text-rose-600 font-medium" : "text-muted-foreground"}`}>{p.stock === 0 ? "Sin stock" : `${p.stock} ${p.unit}`}</span>
                  </div>
                  {p.stock > 0 && <div className="mt-2 flex items-center justify-center gap-1 rounded-md bg-primary/10 text-primary text-xs py-1.5"><Plus className="h-3.5 w-3.5" /> Agregar</div>}
                </button>
              ))}
              {catalog.length === 0 && <div className="col-span-full text-center text-muted-foreground py-10">Sin productos para mostrar.</div>}
            </div>
          </div>

          {/* Carrito */}
          <Card className="p-4 flex flex-col h-fit lg:sticky lg:top-20">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-primary" /> Carrito</div>
              <Badge variant="secondary">{cart.reduce((a, l) => a + l.quantity, 0)}</Badge>
            </div>
            {cart.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">Agrega productos del catálogo.</div>
            ) : (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {cart.map((l) => (
                  <div key={l.productId} className="flex items-center gap-2 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">{l.name}</div>
                      <div className="text-xs text-muted-foreground">{formatMoney(l.unitPrice, currency)} c/u</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setQty(l.productId, l.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                      <input value={l.quantity} onChange={(e) => setQty(l.productId, Number(e.target.value) || 1)} className="w-10 text-center text-sm border rounded h-7" />
                      <Button size="icon" variant="ghost" className="h-6 w-6" disabled={l.quantity + 1 > l.stock} onClick={() => setQty(l.productId, l.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                    </div>
                    <div className="w-16 text-right font-medium whitespace-nowrap">{formatMoney(l.unitPrice * l.quantity - l.discount, currency)}</div>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeLine(l.productId)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 pt-3 border-t space-y-2">
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{formatMoney(subtotal, currency)}</span></div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Descuento</span>
                <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} className="h-7 text-right ml-auto w-28" />
              </div>
              <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">IVA</span><span>{formatMoney(tax, currency)}</span></div>
              <div className="flex items-center justify-between text-lg font-bold"><span>Total</span><span>{formatMoney(total, currency)}</span></div>
              <Button className="w-full mt-2" disabled={cart.length === 0} onClick={openCheckout}>
                <Banknote className="h-4 w-4 mr-1" /> Cobrar
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Checkout */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Cobrar</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-center"><span className="text-xs text-muted-foreground">Total a pagar</span><div className="text-3xl font-bold">{formatMoney(total, currency)}</div></div>
            <div className="space-y-1.5"><Label>Cliente (opcional)</Label><Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Cliente de mostrador" /></div>
            <div className="space-y-1.5">
              <Label>Método de pago</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {method === "Efectivo" && (
              <div className="space-y-1.5">
                <Label>Recibido</Label>
                <Input type="number" min={0} value={received ?? ""} onChange={(e) => setReceived(e.target.value === "" ? undefined : Number(e.target.value))} />
                {received != null && received >= total && <div className="text-sm text-emerald-600">Cambio: {formatMoney(received - total, currency)}</div>}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
            <Button onClick={doCheckout}>Confirmar venta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recibo */}
      <Dialog open={receipt != null} onOpenChange={(o) => { if (!o) setReceipt(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Printer className="h-4 w-4" /> {receipt?.number}</DialogTitle></DialogHeader>
          {receipt && (
            <div className="space-y-2 text-sm">
              <div className="border-b pb-2">
                <div className="font-semibold">VetCare</div>
                <div className="text-xs text-muted-foreground">Punto de venta</div>
              </div>
              <div className="space-y-1">
                {receipt.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between gap-2">
                    <span className="flex-1">{i.quantity}× {i.name}</span>
                    <span className="whitespace-nowrap">{formatMoney(i.lineTotal, currency)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-muted-foreground"><span>Descuento</span><span>{formatMoney(receipt.discount, currency)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>IVA</span><span>{formatMoney(receipt.tax, currency)}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-2"><span>TOTAL</span><span>{formatMoney(receipt.total, currency)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Método</span><span>{receipt.method}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Recibido</span><span>{formatMoney(receipt.received, currency)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Cambio</span><span>{formatMoney(receipt.change, currency)}</span></div>
              <div className="flex justify-end gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => setReceipt(null)}>Cerrar</Button>
                <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Imprimir</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

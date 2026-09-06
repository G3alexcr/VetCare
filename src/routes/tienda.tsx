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
  useAllPosCategories,
  useAllPosProducts,
  type PaymentMethod,
  type PosOrderStatus,
} from "@/lib/pos-store";
import {
  ShoppingCart,
  Store,
  Plus,
  Minus,
  Trash2,
  X,
  Package,
  Search,
  ArrowLeft,
  CreditCard,
  Smartphone,
  Truck,
  Building2,
  MessageCircle,
  CheckCircle2,
  ShieldCheck,
  User,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { usePortalAuth } from "@/lib/portal-auth";
import { useAuth } from "@/lib/auth";
import { useClientes } from "@/lib/clientes-store";
import { toast } from "sonner";

export const Route = createFileRoute("/tienda")({
  head: () => ({ meta: [{ title: "Tienda Online — Go2Vet" }] }),
  component: TiendaOnline,
});

type CartLine = { productId: string; name: string; unitPrice: string; quantity: number; image?: string };
type Confirmed = {
  number: string;
  total: number;
  clientName: string;
  clientPhone: string;
  deliveryMethod: "retiro" | "domicilio";
  deliveryAddress?: string;
  paymentMethod: string;
  paymentStatus: "Pendiente" | "Pagado";
} | null;

function TiendaOnline() {
  const navigate = useNavigate();
  const { owner } = usePortalAuth();
  const { user } = useAuth();
  const tenantProducts = usePosProducts();
  const allPosProducts = useAllPosProducts();
  const products = tenantProducts.length > 0 ? tenantProducts : allPosProducts;

  const tenantCategories = usePosCategories();
  const allPosCategories = useAllPosCategories();
  const categories = tenantCategories.length > 0 ? tenantCategories : allPosCategories;
  const currency = useCurrency();
  const clientes = useClientes();

  const returnTarget = owner ? "/portal/dashboard" : user ? "/dashboard" : "/portal/dashboard";
  const returnLabel = owner ? "Volver a Inicio" : user ? "Volver al Panel" : "Volver a mi app";

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("todas");
  const [sort, setSort] = useState("nombre");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>(owner ? "portal" : "nuevo");
  const [clientName, setClientName] = useState(owner?.nombre ?? "");
  const [clientPhone, setClientPhone] = useState(owner?.telefono || owner?.whatsapp || "");
  const [clientEmail, setClientEmail] = useState(owner?.email ?? "");
  const [deliveryMethod, setDeliveryMethod] = useState<"retiro" | "domicilio">("retiro");
  const [deliveryAddress, setDeliveryAddress] = useState(owner?.direccion ?? "");
  const [onlinePayType, setOnlinePayType] = useState<"tilopay" | "applepay" | "googlepay" | "sinpe" | "efectivo">("tilopay");
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

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId === "portal" && owner) {
      setClientName(owner.nombre || "");
      setClientPhone(owner.telefono || owner.whatsapp || "");
      setClientEmail(owner.email || "");
      setDeliveryAddress(owner.direccion || "");
    } else if (clientId === "nuevo") {
      setClientName("");
      setClientPhone("");
      setClientEmail("");
      setDeliveryAddress("");
    } else {
      const cl = clientes.find((c) => c.id === clientId);
      if (cl) {
        setClientName(cl.nombre);
        setClientPhone(cl.telefono || "");
        setClientEmail(cl.email || "");
        setDeliveryAddress(cl.direccion || "");
      }
    }
  };

  const checkout = () => {
    if (cart.length === 0) return;
    if (!clientName.trim()) return toast.error("Por favor ingresa tu nombre completo");
    if (!clientPhone.trim()) return toast.error("Ingresa tu número de teléfono o WhatsApp para contactarte sobre la entrega");
    if (deliveryMethod === "domicilio" && !deliveryAddress.trim()) {
      return toast.error("Por favor ingresa la dirección de entrega");
    }

    const isOnlinePaid = onlinePayType === "tilopay" || onlinePayType === "applepay" || onlinePayType === "googlepay";
    const payStatus = isOnlinePaid ? ("Pagado" as const) : ("Pendiente" as const);
    const payLabel =
      onlinePayType === "tilopay"
        ? "Tarjeta en línea (Tilopay · Visa / MC)"
        : onlinePayType === "applepay"
        ? "Apple Pay (Tilopay)"
        : onlinePayType === "googlepay"
        ? "Google Pay (Tilopay)"
        : onlinePayType === "sinpe"
        ? "SINPE Móvil"
        : "Efectivo contra entrega";

    const order = addPosOrder({
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim() || undefined,
      deliveryMethod,
      deliveryAddress: deliveryMethod === "domicilio" ? deliveryAddress.trim() : undefined,
      paymentMethod: payLabel,
      paymentStatus: payStatus,
      items: cart.map((l) => ({
        id: `oi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: l.productId,
        name: l.name,
        quantity: l.quantity,
        unitPrice: Number(l.unitPrice),
      })),
      total,
      status: "Pendiente" as PosOrderStatus,
      notes: notes || "Pedido realizado en la tienda online.",
      source: "online",
    });

    setConfirmed({
      number: order.number,
      total: order.total,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      deliveryMethod,
      deliveryAddress: deliveryMethod === "domicilio" ? deliveryAddress.trim() : undefined,
      paymentMethod: payLabel,
      paymentStatus: payStatus,
    });

    toast.success(isOnlinePaid ? "¡Pago aprobado exitosamente por la pasarela en línea!" : "¡Pedido registrado con éxito!");
    setCart([]);
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
                  Go2Vet · Tienda y Farmacia
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
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5 text-emerald-600" /> Carrito y Finalizar Compra
            </DialogTitle>
          </DialogHeader>

          {cart.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-10">Tu carrito está vacío. Agrega productos de la tienda para ordenar.</div>
          ) : (
            <div className="space-y-4 text-sm">
              {/* Productos en el carrito */}
              <div className="border rounded-xl p-3 bg-muted/20 space-y-2.5 max-h-48 overflow-y-auto">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Productos seleccionados ({cart.length})</div>
                {cart.map((l) => (
                  <div key={l.productId} className="flex items-center gap-2 bg-background p-2 rounded-lg border shadow-2xs">
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-semibold text-xs sm:text-sm">{l.name}</div>
                      <div className="text-[11px] text-muted-foreground">{formatMoney(Number(l.unitPrice), currency)} c/u</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setQty(l.productId, l.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <input
                        value={l.quantity}
                        onChange={(e) => setQty(l.productId, Number(e.target.value) || 1)}
                        className="w-8 text-center text-xs font-bold border rounded h-6 bg-background"
                      />
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setQty(l.productId, l.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="w-16 text-right font-bold text-xs whitespace-nowrap">
                      {formatMoney(Number(l.unitPrice) * l.quantity, currency)}
                    </div>
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => remove(l.productId)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Resumen de totales */}
              <div className="p-3 bg-muted/30 rounded-xl border space-y-1.5 text-xs sm:text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>IVA (13%)</span>
                  <span>{formatMoney(tax, currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-1.5 text-foreground">
                  <span>Total a pagar</span>
                  <span className="text-emerald-600">{formatMoney(total, currency)}</span>
                </div>
              </div>

              {/* Datos del Cliente */}
              <div className="space-y-3 pt-1 border-t">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-emerald-600" /> Datos del Comprador
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">¿Eres cliente registrado o invitado?</Label>
                  <Select value={selectedClientId} onValueChange={handleSelectClient}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Seleccionar cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {owner && <SelectItem value="portal">👤 Conectado como dueño: {owner.nombre}</SelectItem>}
                      <SelectItem value="nuevo">➕ Cliente nuevo / Comprador invitado</SelectItem>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          👤 {c.nombre} {c.telefono ? `(${c.telefono})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-xs">Nombre completo *</Label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ej: María Rodríguez"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs flex items-center justify-between">
                      <span>Teléfono / WhatsApp *</span>
                      <span className="text-[10px] text-emerald-600 font-normal">Para contactarte</span>
                    </Label>
                    <Input
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Ej: +506 8888-8888"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Correo electrónico (opcional)</Label>
                  <Input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="maria@ejemplo.com"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Método de Entrega */}
              <div className="space-y-2 pt-2 border-t">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-emerald-600" /> Método de Entrega
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("retiro")}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
                      deliveryMethod === "retiro"
                        ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600"
                        : "border-border hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <Building2 className={`h-4 w-4 mt-0.5 shrink-0 ${deliveryMethod === "retiro" ? "text-emerald-600" : ""}`} />
                    <div>
                      <div className="text-xs font-semibold text-foreground">Retiro en clínica</div>
                      <div className="text-[10px] text-muted-foreground">Gratis · En sucursal</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod("domicilio")}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
                      deliveryMethod === "domicilio"
                        ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-600"
                        : "border-border hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <Truck className={`h-4 w-4 mt-0.5 shrink-0 ${deliveryMethod === "domicilio" ? "text-emerald-600" : ""}`} />
                    <div>
                      <div className="text-xs font-semibold text-foreground">Envío a domicilio</div>
                      <div className="text-[10px] text-muted-foreground">Mensajería directa</div>
                    </div>
                  </button>
                </div>

                {deliveryMethod === "domicilio" && (
                  <div className="space-y-1 animate-in fade-in-50 duration-200">
                    <Label className="text-xs flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Dirección exacta de entrega *
                    </Label>
                    <Input
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Provincia, cantón, señas exactas..."
                      className="h-9 text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Opciones de Pago */}
              <div className="space-y-2 pt-2 border-t">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-emerald-600" /> Opciones de Pago
                </div>

                <div className="space-y-2">
                  {/* Tarjeta / Tilopay */}
                  <div
                    onClick={() => setOnlinePayType("tilopay")}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      onlinePayType === "tilopay" || onlinePayType === "applepay" || onlinePayType === "googlepay"
                        ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                        : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-bold text-foreground">Pago en línea inmediato (Tilopay)</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 bg-emerald-100/50">
                        Aprobación instantánea
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOnlinePayType("tilopay");
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-md font-medium border ${
                          onlinePayType === "tilopay"
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-background border-border text-muted-foreground"
                        }`}
                      >
                        💳 Visa / Mastercard
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOnlinePayType("applepay");
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-md font-medium border flex items-center gap-1 ${
                          onlinePayType === "applepay"
                            ? "bg-black text-white border-black"
                            : "bg-background border-border text-muted-foreground"
                        }`}
                      >
                         Apple Pay
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOnlinePayType("googlepay");
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-md font-medium border flex items-center gap-1 ${
                          onlinePayType === "googlepay"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-background border-border text-muted-foreground"
                        }`}
                      >
                        G Pay (Google)
                      </button>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      Cifrado bancario seguro 256-bit provisto por Tilopay Gateway.
                    </div>
                  </div>

                  {/* SINPE Móvil */}
                  <div
                    onClick={() => setOnlinePayType("sinpe")}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      onlinePayType === "sinpe"
                        ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                        : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-emerald-600" />
                      <div>
                        <div className="text-xs font-semibold text-foreground">SINPE Móvil / Transferencia</div>
                        <div className="text-[10px] text-muted-foreground">Transfiere al número de la clínica (+506 8888-0000)</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">Costa Rica</span>
                  </div>

                  {/* Efectivo contra entrega */}
                  <div
                    onClick={() => setOnlinePayType("efectivo")}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      onlinePayType === "efectivo"
                        ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600"
                        : "border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-amber-600" />
                      <div>
                        <div className="text-xs font-semibold text-foreground">Efectivo contra entrega</div>
                        <div className="text-[10px] text-muted-foreground">Pagas al retirar en clínica o al recibir tu envío</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Contra entrega</span>
                  </div>
                </div>
              </div>

              {/* Indicaciones especiales */}
              <div className="space-y-1 pt-2 border-t">
                <Label className="text-xs">Notas adicionales para la clínica (opcional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: Dejar en recepción, llamar antes de llegar..."
                  className="h-9 text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button variant="outline" onClick={() => setCartOpen(false)} className="rounded-xl">
              <X className="h-4 w-4 mr-1" /> Seguir comprando
            </Button>
            <Button
              disabled={cart.length === 0}
              onClick={checkout}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs"
            >
              {onlinePayType === "tilopay" || onlinePayType === "applepay" || onlinePayType === "googlepay" ? (
                <>
                  <CreditCard className="h-4 w-4 mr-1.5" />
                  Pagar {formatMoney(total, currency)} con Tilopay
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Confirmar Pedido ({formatMoney(total, currency)})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmación de Pedido */}
      <Dialog open={confirmed != null} onOpenChange={(o) => { if (!o) setConfirmed(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center sm:text-left">
            <div className="mx-auto sm:mx-0 w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 grid place-items-center mb-2 shadow-xs">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <DialogTitle className="text-lg font-bold text-emerald-700">¡Pedido recibido con éxito!</DialogTitle>
          </DialogHeader>

          {confirmed && (
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-900">Número de Pedido:</span>
                  <Badge className="bg-emerald-700 hover:bg-emerald-700 text-white font-mono font-bold text-xs">
                    {confirmed.number}
                  </Badge>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed pt-1">
                  Tu pedido ha sido registrado directamente en el sistema de la clínica veterinaria para su preparación inmediata.
                </p>
              </div>

              {/* Detalle de entrega y pago */}
              <div className="p-3 rounded-xl border bg-muted/20 space-y-2 text-xs">
                <div className="flex justify-between items-center pb-1.5 border-b">
                  <span className="text-muted-foreground flex items-center gap-1"><User className="h-3.5 w-3.5" /> Comprador</span>
                  <span className="font-semibold text-foreground">{confirmed.clientName}</span>
                </div>

                <div className="flex justify-between items-center pb-1.5 border-b">
                  <span className="text-muted-foreground flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> Teléfono / WhatsApp</span>
                  <span className="font-semibold text-foreground">{confirmed.clientPhone}</span>
                </div>

                <div className="flex justify-between items-start pb-1.5 border-b">
                  <span className="text-muted-foreground flex items-center gap-1 shrink-0"><Truck className="h-3.5 w-3.5" /> Entrega</span>
                  <span className="font-semibold text-right text-foreground">
                    {confirmed.deliveryMethod === "domicilio"
                      ? `A domicilio (${confirmed.deliveryAddress || "Dirección indicada"})`
                      : "Retiro en recepción de la clínica"}
                  </span>
                </div>

                <div className="flex justify-between items-center pb-1.5 border-b">
                  <span className="text-muted-foreground flex items-center gap-1"><CreditCard className="h-3.5 w-3.5" /> Método de pago</span>
                  <span className="font-semibold text-foreground">{confirmed.paymentMethod}</span>
                </div>

                <div className="flex justify-between items-center pb-1.5 border-b">
                  <span className="text-muted-foreground">Estado del pago</span>
                  <Badge
                    variant={confirmed.paymentStatus === "Pagado" ? "default" : "outline"}
                    className={
                      confirmed.paymentStatus === "Pagado"
                        ? "bg-emerald-600 hover:bg-emerald-600 text-white font-semibold"
                        : "border-amber-400 text-amber-700 bg-amber-50 font-semibold"
                    }
                  >
                    {confirmed.paymentStatus === "Pagado" ? "✅ Pagado en línea (Aprobado)" : "⏳ Pendiente de pago"}
                  </Badge>
                </div>

                <div className="flex justify-between items-center pt-1 font-bold text-sm">
                  <span>Total</span>
                  <span className="text-emerald-600 text-base">{formatMoney(confirmed.total, currency)}</span>
                </div>
              </div>

              {/* Botón WhatsApp */}
              <div className="pt-1">
                <Button
                  asChild
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 rounded-xl shadow-xs gap-2"
                >
                  <a
                    href={`https://wa.me/506${confirmed.clientPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                      `Hola ${confirmed.clientName}, tu pedido ${confirmed.number} por ${formatMoney(
                        confirmed.total,
                        currency
                      )} está registrado y en preparación.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" /> Notificar o Abrir WhatsApp
                  </a>
                </Button>
              </div>

              <Button variant="outline" className="w-full rounded-xl" onClick={() => setConfirmed(null)}>
                Volver a la tienda
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

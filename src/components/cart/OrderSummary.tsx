import type { Quote } from "@/lib/cart-types";
import { formatPrice } from "@/lib/format";

export function OrderSummary({ quote, shippingLabel, loading }: { quote: Quote; shippingLabel?: string; loading?: boolean }) {
  const Row = ({ l, v, className = "" }: { l: string; v: string; className?: string }) => (
    <div className={`flex justify-between gap-4 ${className}`}><span>{l}</span><span className="tabular-nums">{v}</span></div>
  );
  return (
    <div className={`space-y-2.5 text-sm text-bone-muted transition-opacity ${loading ? "opacity-50" : ""}`}>
      <Row l={`Sous-total (${quote.itemCount} article${quote.itemCount > 1 ? "s" : ""})`} v={formatPrice(quote.subtotal)} />
      {quote.autoDiscount > 0 && <Row l={quote.autoDiscountLabel ?? "Remise"} v={`−${formatPrice(quote.autoDiscount)}`} className="text-pitch" />}
      {quote.promoDiscount > 0 && <Row l={`Code ${quote.promoCode}`} v={`−${formatPrice(quote.promoDiscount)}`} className="text-pitch" />}
      <Row l={shippingLabel ? `Livraison · ${shippingLabel}` : "Livraison"} v={quote.shipping === 0 ? "Offerte" : formatPrice(quote.shipping)} />
      <div className="flex justify-between border-t border-ink-600 pt-4 text-lg font-semibold text-bone">
        <span>Total TTC</span>
        <span className="tabular-nums">{formatPrice(quote.total)}</span>
      </div>
    </div>
  );
}

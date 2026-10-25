// Order status labels (safe to import from client components).
export const ORDER_STATUS: Record<string, string> = {
  PENDING_PAYMENT: "Ödeme bekleniyor",
  PAID: "Ödendi",
  PREPARING: "Hazırlanıyor",
  SHIPPED: "Kargoya verildi",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal edildi",
  REFUNDED: "İade edildi",
};
export const CLOSED_STATUSES = ["CANCELLED", "REFUNDED"];
export const PAYMENT_LABEL: Record<string, string> = {
  DEMO: "Demo / test ödemesi",
  BANK_TRANSFER: "Havale / EFT",
};

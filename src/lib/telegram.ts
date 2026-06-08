const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN as string;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID as string;

export async function sendOrderNotification(order: {
  fullName: string;
  phone: string;
  note?: string;
  totalPrice: number;
  items: { name?: string; quantity: number; price: number }[];
}) {
  const itemLines = order.items
    .map(
      (item, i) =>
        `  ${i + 1}. ${item.name || "Mahsulot"} — ${item.quantity} dona × ${item.price.toLocaleString()} = <b>${(item.quantity * item.price).toLocaleString()} so'm</b>`,
    )
    .join("\n");

  const text =
    `🛍 <b>Yangi buyurtma!</b>\n\n` +
    `👤 <b>Ism:</b> ${order.fullName}\n` +
    `📞 <b>Tel:</b> ${order.phone}\n\n` +
    `📦 <b>Mahsulotlar:</b>\n${itemLines}\n\n` +
    `💰 <b>Jami summa:</b> ${order.totalPrice.toLocaleString()} so'm` +
    (order.note ? `\n\n💬 <b>Izoh:</b> ${order.note}` : "");

  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
    }),
  });
}

import { notFound } from "next/navigation";
import { OrderDetail } from "@/components/OrderDetail";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function MyOrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const user = await requireUser("/hesabim/siparisler");
  const order = await prisma.order.findFirst({
    where: { orderNumber: (await params).orderNumber, userId: user.id },
    include: { items: true, events: { orderBy: { createdAt: "asc" } } },
  });
  if (!order) notFound();
  return (
    <div className="grid gap-4">
      <h2 className="text-3xl">Sipariş {order.orderNumber}</h2>
      <OrderDetail order={order} />
    </div>
  );
}

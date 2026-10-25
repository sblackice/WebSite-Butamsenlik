import { prisma } from "@/lib/db";
import { Flash, PageHead, type AdminSP } from "../../_components";
import { ProductForm } from "../ProductForm";

export default async function NewProduct({ searchParams }: { searchParams: AdminSP }) {
  const [categories, collections] = await Promise.all([
    prisma.category.findMany({ where: { parentId: null }, orderBy: { sortOrder: "asc" }, include: { children: { orderBy: { sortOrder: "asc" } } } }),
    prisma.collection.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <div className="grid max-w-4xl gap-5">
      <PageHead title="Yeni ürün" />
      <Flash searchParams={searchParams} />
      <ProductForm categories={categories} collections={collections} />
    </div>
  );
}

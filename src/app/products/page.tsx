import Products from "@/views/Products";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; highlight?: string; subcategoryId?: string }>;
}) {
  const sp = (await searchParams) ?? {};

  return (
    <Products
      initialCategory={sp.category}
      initialSubcategoryId={sp.subcategoryId}
      initialHighlight={sp.highlight}
    />
  );
}

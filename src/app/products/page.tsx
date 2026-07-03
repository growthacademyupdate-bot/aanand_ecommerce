import Products from "@/views/Products";

export default function Page({
  searchParams,
}: {
  searchParams?: { category?: string; highlight?: string; subcategoryId?: string };
}) {
  const sp = searchParams ?? {};

  return (
    <Products
      initialCategory={sp.category}
      initialSubcategoryId={sp.subcategoryId}
      initialHighlight={sp.highlight}
    />
  );
}

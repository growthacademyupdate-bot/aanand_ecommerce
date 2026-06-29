import Products from "@/pages/Products";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; highlight?: string }>;
}) {
  const sp = (await searchParams) ?? {};

  return (
    <Products
      initialCategory={sp.category}
      initialHighlight={sp.highlight}
    />
  );
}

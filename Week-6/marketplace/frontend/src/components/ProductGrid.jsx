import ProductCard from "./ProductCard";

export default function ProductGrid({ products, loading }) {
  if (!products) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse bg-paper-white" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-paper-white px-4 py-16 text-center">
        <h2 className="text-[20px] font-bold">No products found</h2>
        <p className="mt-2 text-[15px] text-slate-gray">
          Try changing or clearing your filters.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 gap-2 transition-opacity sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 ${
        loading ? "opacity-60" : ""
      }`}
    >
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

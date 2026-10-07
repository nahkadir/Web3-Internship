import { Link } from "react-router-dom";
import ProductImage from "./ProductImage";
import { formatPrice, stockLabel } from "../lib/utils";

export default function ProductCard({ product: p }) {
  return (
    <article className="flex flex-col bg-paper-white p-4">
      <Link
        to={`/products/${p.id}`}
        className="block aspect-square overflow-hidden bg-morning-mist"
      >
        <ProductImage
          src={p.images?.[0]}
          alt={p.name}
          className="h-full w-full"
        />
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        <Link
          to={`/vendor/${p.vendor?.id}`}
          className="text-[11px] text-graphite hover:underline"
        >
          {p.vendor?.storeName}
        </Link>
        <Link
          to={`/products/${p.id}`}
          className="mt-1 line-clamp-2 text-[15px] leading-[1.2] text-midcurrent-navy"
        >
          {p.name}
        </Link>
        <p className="mt-1 text-[12px] text-slate-gray">{p.category?.name}</p>
        <p className="mt-2 text-[13px] font-medium text-slate-gray">
          {formatPrice(p.price)}
        </p>
        <p className="mt-1 text-[12px] text-slate-gray">
          {stockLabel(p.stock)}
        </p>

        <Link
          to={`/products/${p.id}`}
          className="mt-4 inline-flex items-center justify-center self-start rounded-[30px] border border-cloud-veil px-4 py-2 text-[13px] font-medium text-midcurrent-navy hover:border-soft-stone"
        >
          View details
        </Link>
      </div>
    </article>
  );
}

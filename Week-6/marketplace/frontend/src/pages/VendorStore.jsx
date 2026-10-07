import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { buildQuery, formatDate } from "../lib/utils";
import ProductImage from "../components/ProductImage";
import ProductGrid from "../components/ProductGrid";
import Pagination from "../components/Pagination";

export default function VendorStore() {
  const { id } = useParams();
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [id]);

  const store = useApi(`/vendors/${id}`);
  const products = useApi(
    `/products${buildQuery({ vendor: id, page, limit: 15 })}`,
  );

  if (store.loading && !store.data) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-16 text-slate-gray">
        Loading...
      </div>
    );
  }

  if (store.error || !store.data) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-16 text-center">
        <h1 className="text-[30px] font-bold">Store not found</h1>
        <Link
          to="/products"
          className="mt-6 inline-block font-medium underline"
        >
          Back to the marketplace
        </Link>
      </div>
    );
  }

  const v = store.data.vendor;

  return (
    <>
      <section className="border-b border-cloud-veil bg-paper-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-6 px-4 py-10">
          <ProductImage
            src={v.logo}
            alt={v.storeName}
            className="h-20 w-20 shrink-0"
          />
          <div>
            <p className="text-[11px] font-medium uppercase">Store</p>
            <h1 className="mt-1 text-[44px] font-bold leading-[1.1]">
              {v.storeName}
            </h1>
            {v.storeDescription && (
              <p className="mt-2 max-w-2xl text-[16px] text-slate-gray">
                {v.storeDescription}
              </p>
            )}
            <p className="mt-2 text-[13px] text-slate-gray">
              On the marketplace since {formatDate(v.createdAt)}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-4 py-10">
        <h2 className="mb-4 text-[26px] font-bold leading-[1.2]">Products</h2>
        <ProductGrid
          products={products.data?.products}
          loading={products.loading}
        />
        <Pagination
          pagination={products.data?.pagination}
          onPage={(n) => {
            setPage(n);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
    </>
  );
}

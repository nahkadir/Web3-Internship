import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { useDebounce } from "../hooks/useDebounce";
import { buildQuery } from "../lib/utils";
import FormField from "../components/FormField";
import Select from "../components/Select";
import Button from "../components/Button";
import ProductGrid from "../components/ProductGrid";
import Pagination from "../components/Pagination";

const LIMIT = 15;

export default function Products() {
  const [params, setParams] = useSearchParams();
  const get = (k) => params.get(k) || "";
  const page = Number(get("page")) || 1;
  const sort = get("sort") || "newest";

  const update = (patch, keepPage = false) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([k, v]) =>
          v ? next.set(k, v) : next.delete(k),
        );
        if (!keepPage) next.delete("page");
        return next;
      },
      { replace: true },
    );

  // typed inputs are debounced before they hit the URL / API
  const [searchInput, setSearchInput] = useState(get("search"));
  const [minInput, setMinInput] = useState(get("minPrice"));
  const [maxInput, setMaxInput] = useState(get("maxPrice"));
  const dSearch = useDebounce(searchInput);
  const dMin = useDebounce(minInput);
  const dMax = useDebounce(maxInput);

  useEffect(() => {
    if (dSearch !== get("search")) update({ search: dSearch });
  }, [dSearch]);
  useEffect(() => {
    if (dMin !== get("minPrice")) update({ minPrice: dMin });
  }, [dMin]);
  useEffect(() => {
    if (dMax !== get("maxPrice")) update({ maxPrice: dMax });
  }, [dMax]);

  const priceInvalid =
    get("minPrice") &&
    get("maxPrice") &&
    Number(get("minPrice")) > Number(get("maxPrice"));

  const query = buildQuery({
    search: get("search"),
    category: get("category"),
    vendor: get("vendor"),
    minPrice: get("minPrice"),
    maxPrice: get("maxPrice"),
    sort,
    page,
    limit: LIMIT,
  });

  const products = useApi(`/products${query}`, { enabled: !priceInvalid });
  const categories = useApi("/categories");
  const vendors = useApi("/vendors");

  const hasFilters = [
    "search",
    "category",
    "vendor",
    "minPrice",
    "maxPrice",
  ].some((k) => get(k));

  const clearFilters = () => {
    setSearchInput("");
    setMinInput("");
    setMaxInput("");
    setParams({}, { replace: true });
  };

  const goToPage = (n) => {
    update({ page: n > 1 ? String(n) : "" }, true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const total = products.data?.pagination?.total;

  return (
    <>
      <section className="bg-morning-mist">
        <div className="mx-auto max-w-[1200px] px-4 pb-8 pt-12 text-center">
          <p className="text-[11px] font-medium uppercase">The marketplace</p>
          <h1 className="mx-auto mt-3 max-w-2xl text-[44px] font-bold leading-[1.1]">
            Shop from independent vendors
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[16px] text-slate-gray">
            Honest products from approved stores, all in one place.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-4 pb-16">
        <div className="grid gap-4 bg-paper-white p-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <FormField
              id="search"
              label="Search"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Select
            id="category"
            label="Category"
            value={get("category")}
            onChange={(e) => update({ category: e.target.value })}
          >
            <option value="">All categories</option>
            {categories.data?.categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select
            id="vendor"
            label="Store"
            value={get("vendor")}
            onChange={(e) => update({ vendor: e.target.value })}
          >
            <option value="">All stores</option>
            {vendors.data?.vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.storeName}
              </option>
            ))}
          </Select>
          <FormField
            id="minPrice"
            label="Min price"
            type="number"
            min="0"
            placeholder="0"
            value={minInput}
            onChange={(e) => setMinInput(e.target.value)}
          />
          <FormField
            id="maxPrice"
            label="Max price"
            type="number"
            min="0"
            placeholder="Any"
            value={maxInput}
            onChange={(e) => setMaxInput(e.target.value)}
            error={
              priceInvalid ? "Min price cannot exceed max price" : undefined
            }
          />
        </div>

        <div className="my-6 flex flex-wrap items-end justify-between gap-4">
          <p className="text-[14px] text-slate-gray">
            {total === undefined
              ? "Loading..."
              : `${total} product${total === 1 ? "" : "s"}`}
          </p>
          <div className="flex items-end gap-3">
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            )}
            <div className="w-52">
              <Select
                id="sort"
                value={sort}
                onChange={(e) => update({ sort: e.target.value })}
                aria-label="Sort products"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </Select>
            </div>
          </div>
        </div>

        {products.error ? (
          <div className="bg-paper-white px-4 py-12 text-center">
            <p className="text-[15px] text-red-700">{products.error.message}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={products.reload}
            >
              Try again
            </Button>
          </div>
        ) : (
          <>
            <ProductGrid
              products={priceInvalid ? [] : products.data?.products}
              loading={products.loading}
            />
            <Pagination
              pagination={products.data?.pagination}
              onPage={goToPage}
            />
          </>
        )}
      </div>
    </>
  );
}

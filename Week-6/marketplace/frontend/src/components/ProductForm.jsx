import { useState } from "react";
import { api, ApiError } from "../lib/api";
import { isHttpUrl } from "../lib/utils";
import FormField from "./FormField";
import Select from "./Select";
import Button from "./Button";
import ProductImage from "./ProductImage";

const parseImages = (text) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

export default function ProductForm({
  product,
  categories,
  onCancel,
  onSaved,
}) {
  const editing = !!product;
  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price ?? "",
    stock: product?.stock ?? 0,
    categoryId: product?.categoryId ?? "",
    images: (product?.images ?? []).join("\n"),
    status:
      product?.status === "OUT_OF_STOCK"
        ? "ACTIVE"
        : (product?.status ?? "DRAFT"),
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 3)
      e.name = "Name must be at least 3 characters";
    if (form.price === "" || !(Number(form.price) > 0))
      e.price = "Price must be greater than zero";
    const stock = Number(form.stock);
    if (form.stock === "" || !Number.isInteger(stock) || stock < 0)
      e.stock = "Stock must be a whole number, 0 or more";
    if (!form.categoryId) e.categoryId = "Select a category";
    const urls = parseImages(form.images);
    if (urls.length > 6) e.images = "Maximum 6 images";
    else if (urls.some((u) => !isHttpUrl(u)))
      e.images = "Each line must be a valid URL (https://...)";
    if (form.status === "ACTIVE" && !form.description.trim())
      e.description = "Description is required to publish";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        categoryId: form.categoryId,
        images: parseImages(form.images),
        status: form.status,
      };
      await api(
        editing ? `/vendor/products/${product.id}` : "/vendor/products",
        {
          method: editing ? "PATCH" : "POST",
          body,
        },
      );
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.errors.length) {
        setErrors(
          Object.fromEntries(
            err.errors.map((x) => [x.field.split(".")[0], x.message]),
          ),
        );
        setFormError(err.message);
      } else {
        setFormError(err.message || "Cannot reach the server");
      }
    } finally {
      setLoading(false);
    }
  };

  const previews = parseImages(form.images).filter(isHttpUrl).slice(0, 6);

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-paper-white p-6">
      <h2 className="text-[26px] font-bold leading-[1.2]">
        {editing ? "Edit product" : "Add product"}
      </h2>

      {formError && (
        <p
          role="alert"
          className="mt-4 rounded-[30px] border border-red-700 px-5 py-2 text-[13px] text-red-700"
        >
          {formError}
        </p>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <FormField
            id="name"
            label="Product name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
          />
        </div>
        <div className="md:col-span-2">
          <FormField
            as="textarea"
            id="description"
            label="Description"
            value={form.description}
            onChange={handleChange}
            error={errors.description}
          />
        </div>
        <FormField
          id="price"
          label="Price"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={handleChange}
          error={errors.price}
        />
        <FormField
          id="stock"
          label="Stock"
          type="number"
          min="0"
          step="1"
          value={form.stock}
          onChange={handleChange}
          error={errors.stock}
        />
        <Select
          id="categoryId"
          label="Category"
          value={form.categoryId}
          onChange={handleChange}
          error={errors.categoryId}
        >
          <option value="">Select a category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          id="status"
          label="Visibility"
          value={form.status}
          onChange={handleChange}
          error={errors.status}
        >
          <option value="DRAFT">Draft (hidden)</option>
          <option value="ACTIVE">Active (published)</option>
          {editing && <option value="ARCHIVED">Archived</option>}
        </Select>
        <div className="md:col-span-2">
          <FormField
            as="textarea"
            id="images"
            label="Image URLs"
            hint="One URL per line, up to 6. The first image is the main one."
            placeholder="https://..."
            value={form.images}
            onChange={handleChange}
            error={errors.images}
          />
          {previews.length > 0 && (
            <div className="mt-3 flex gap-2">
              {previews.map((src) => (
                <ProductImage
                  key={src}
                  src={src}
                  alt=""
                  className="h-16 w-16"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex gap-3">
        <Button type="submit" loading={loading}>
          {editing ? "Save changes" : "Create product"}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

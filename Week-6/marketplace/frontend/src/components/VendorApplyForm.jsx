import { useState } from "react";
import { api, ApiError } from "../lib/api";
import { isHttpUrl } from "../lib/utils";
import FormField from "./FormField";
import Button from "./Button";

export default function VendorApplyForm({ onSubmitted }) {
  const [form, setForm] = useState({
    storeName: "",
    storeDescription: "",
    logo: "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const found = {};
    if (form.storeName.trim().length < 2)
      found.storeName = "Store name must be at least 2 characters";
    if (form.logo.trim() && !isHttpUrl(form.logo.trim()))
      found.logo = "Logo must be a valid URL (https://...)";
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      const body = { storeName: form.storeName.trim() };
      if (form.storeDescription.trim())
        body.storeDescription = form.storeDescription.trim();
      if (form.logo.trim()) body.logo = form.logo.trim();

      const data = await api("/vendors", { method: "POST", body });
      await onSubmitted(data.vendor);
    } catch (err) {
      if (err instanceof ApiError && err.errors.length) {
        setErrors(
          Object.fromEntries(err.errors.map((x) => [x.field, x.message])),
        );
      } else {
        setFormError(err.message || "Cannot reach the server");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {formError && (
        <p
          role="alert"
          className="rounded-[30px] border border-red-700 px-5 py-2 text-[13px] text-red-700"
        >
          {formError}
        </p>
      )}
      <FormField
        id="storeName"
        label="Store name"
        placeholder="e.g. Rida's Jackets"
        value={form.storeName}
        onChange={handleChange}
        error={errors.storeName}
      />
      <FormField
        as="textarea"
        id="storeDescription"
        label="Store description"
        placeholder="What do you sell?"
        value={form.storeDescription}
        onChange={handleChange}
        error={errors.storeDescription}
      />
      <FormField
        id="logo"
        label="Logo URL (optional)"
        placeholder="https://..."
        value={form.logo}
        onChange={handleChange}
        error={errors.logo}
      />
      <Button type="submit" loading={loading}>
        Submit application
      </Button>
    </form>
  );
}

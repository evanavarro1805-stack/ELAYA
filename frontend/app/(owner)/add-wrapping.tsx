import { ProductForm } from "@/src/components/ProductForm";

export default function AddWrapping() {
  return (
    <ProductForm
      title="Add Wrapping"
      endpoint="/owner/wrappings"
      defaultImage="https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400"
      fields={[
        { key: "name", label: "Wrap Name", placeholder: "Pink Wrapper", required: true },
        { key: "style", label: "Style", placeholder: "Romantic / Rustic / Modern" },
        { key: "colors", label: "Colors (comma-separated hex)", placeholder: "#FF7EB3", type: "csv" },
        { key: "price", label: "Price (₱)", placeholder: "50", type: "number", required: true },
        { key: "stock", label: "Stock", placeholder: "100", type: "number" },
        { key: "availability", label: "Availability", type: "bool" },
      ]}
    />
  );
}

import { ProductForm } from "@/src/components/ProductForm";

export default function AddFlower() {
  return (
    <ProductForm
      title="Add Flower"
      endpoint="/owner/flowers"
      defaultImage="https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600"
      fields={[
        { key: "name", label: "Flower Name", placeholder: "Red Rose", required: true },
        { key: "category", label: "Category", placeholder: "Roses" },
        { key: "description", label: "Description", placeholder: "Fresh handpicked...", type: "multiline" },
        { key: "colors", label: "Available Colors (comma-separated hex)", placeholder: "#B91C1C, #E11D48", type: "csv" },
        { key: "price", label: "Price (₱)", placeholder: "50", type: "number", required: true },
        { key: "stock", label: "Stock Quantity", placeholder: "100", type: "number" },
        { key: "availability", label: "Availability", type: "bool" },
      ]}
    />
  );
}

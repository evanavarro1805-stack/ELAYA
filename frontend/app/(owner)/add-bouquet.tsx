import { ProductForm } from "@/src/components/ProductForm";

export default function AddBouquet() {
  return (
    <ProductForm
      title="Add Bouquet"
      endpoint="/owner/bouquets"
      defaultImage="https://images.unsplash.com/photo-1561848355-890d054dc55a?w=800"
      fields={[
        { key: "name", label: "Bouquet Name", placeholder: "Romantic Red Roses", required: true },
        { key: "description", label: "Description", placeholder: "A classic dozen roses...", type: "multiline" },
        { key: "flowers_included", label: "Flowers Included (comma-separated)", placeholder: "Red Rose, Baby's Breath", type: "csv" },
        { key: "number_of_flowers", label: "Number of Flowers", placeholder: "12", type: "number" },
        { key: "wrapping", label: "Wrapping", placeholder: "White Wrapper" },
        { key: "ribbon", label: "Ribbon", placeholder: "Red Ribbon" },
        { key: "price", label: "Price (₱)", placeholder: "850", type: "number", required: true },
        { key: "stock", label: "Stock Quantity", placeholder: "10", type: "number" },
        { key: "availability", label: "Availability", type: "bool" },
      ]}
    />
  );
}

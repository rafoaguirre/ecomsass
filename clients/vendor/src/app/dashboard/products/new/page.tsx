import { ProductForm } from '../product-form';

export default function NewProductPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Add product</h1>
        <p className="text-sm text-gray-500">Add a new product to your store catalog</p>
      </div>
      <ProductForm />
    </div>
  );
}

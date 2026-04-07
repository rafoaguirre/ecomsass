'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ShadcnButton } from '@ecomsaas/ui/shadcn';
import { deleteProduct } from './actions';

export function DeleteButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${productName}"? This cannot be undone.`)) return;

    setPending(true);
    const result = await deleteProduct(productId);
    setPending(false);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Product deleted.');
    }
  }

  return (
    <ShadcnButton
      variant="ghost"
      size="sm"
      className="text-red-600 hover:bg-red-50 hover:text-red-700"
      onClick={handleDelete}
      disabled={pending}
    >
      {pending ? 'Deleting…' : 'Delete'}
    </ShadcnButton>
  );
}

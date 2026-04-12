'use client';

import { useActionState } from 'react';
import { ShadcnButton, ShadcnInput, ShadcnLabel } from '@ecomsaas/ui/shadcn';
import { updateOrderStatus, type OrderActionState } from '../actions';
import { useEffect, useState } from 'react';

/**
 * Valid transitions mirror the domain state machine
 * (packages/domain/src/models/OrderModel.ts)
 */
const VALID_TRANSITIONS: Record<
  string,
  { status: string; label: string; destructive?: boolean }[]
> = {
  PLACED: [
    { status: 'CONFIRMED', label: 'Confirm Order' },
    { status: 'CANCELLED', label: 'Cancel Order', destructive: true },
  ],
  CONFIRMED: [
    { status: 'PROCESSING', label: 'Start Processing' },
    { status: 'CANCELLED', label: 'Cancel Order', destructive: true },
  ],
  PROCESSING: [
    { status: 'PACKED', label: 'Mark Packed' },
    { status: 'CANCELLED', label: 'Cancel Order', destructive: true },
  ],
  PACKED: [
    { status: 'IN_TRANSIT', label: 'Ship Order' },
    { status: 'CANCELLED', label: 'Cancel Order', destructive: true },
  ],
  IN_TRANSIT: [{ status: 'DELIVERED', label: 'Mark Delivered' }],
  DELIVERED: [
    { status: 'COMPLETED', label: 'Complete Order' },
    { status: 'REFUNDED', label: 'Full Refund', destructive: true },
    { status: 'PARTIALLY_REFUNDED', label: 'Partial Refund', destructive: true },
  ],
  PARTIALLY_REFUNDED: [
    { status: 'COMPLETED', label: 'Complete Order' },
    { status: 'REFUNDED', label: 'Full Refund', destructive: true },
  ],
};

interface OrderStatusActionsProps {
  orderId: string;
  currentStatus: string;
}

export function OrderStatusActions({ orderId, currentStatus }: OrderStatusActionsProps) {
  const transitions = VALID_TRANSITIONS[currentStatus];
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [state, formAction, isPending] = useActionState<OrderActionState, FormData>(
    updateOrderStatus,
    null
  );

  // Reset shipping form when status changes (after a successful update)
  useEffect(() => {
    setShowShippingForm(false);
  }, [currentStatus]);

  if (!transitions || transitions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Update Status</h3>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-600">{state.success}</p>}

      {/* Shipping form for IN_TRANSIT transition */}
      {showShippingForm && (
        <form action={formAction} className="space-y-3 rounded-lg border border-gray-200 p-4">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="status" value="IN_TRANSIT" />
          <div>
            <ShadcnLabel htmlFor="trackingNumber">Tracking Number</ShadcnLabel>
            <ShadcnInput
              id="trackingNumber"
              name="trackingNumber"
              placeholder="e.g. 1Z999AA10123456784"
              className="mt-1"
            />
          </div>
          <div>
            <ShadcnLabel htmlFor="carrier">Carrier</ShadcnLabel>
            <ShadcnInput
              id="carrier"
              name="carrier"
              placeholder="e.g. UPS, FedEx, USPS"
              className="mt-1"
            />
          </div>
          <div className="flex gap-2">
            <ShadcnButton type="submit" disabled={isPending}>
              {isPending ? 'Updating…' : 'Ship Order'}
            </ShadcnButton>
            <ShadcnButton
              type="button"
              variant="secondary"
              onClick={() => setShowShippingForm(false)}
            >
              Cancel
            </ShadcnButton>
          </div>
        </form>
      )}

      {!showShippingForm && (
        <div className="flex flex-wrap gap-2">
          {transitions.map((t) => {
            // For shipping, show the form instead of submitting directly
            if (t.status === 'IN_TRANSIT') {
              return (
                <ShadcnButton
                  key={t.status}
                  variant={t.destructive ? 'ghost' : 'primary'}
                  size="sm"
                  className={
                    t.destructive ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : undefined
                  }
                  onClick={() => setShowShippingForm(true)}
                  disabled={isPending}
                >
                  {t.label}
                </ShadcnButton>
              );
            }

            return (
              <form key={t.status} action={formAction}>
                <input type="hidden" name="orderId" value={orderId} />
                <input type="hidden" name="status" value={t.status} />
                <ShadcnButton
                  type="submit"
                  variant={t.destructive ? 'ghost' : 'primary'}
                  size="sm"
                  className={
                    t.destructive ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : undefined
                  }
                  disabled={isPending}
                >
                  {isPending ? 'Updating…' : t.label}
                </ShadcnButton>
              </form>
            );
          })}
        </div>
      )}
    </div>
  );
}

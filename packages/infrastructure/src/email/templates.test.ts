import { describe, it, expect } from 'vitest';
import { emailTemplates } from './templates';

describe('emailTemplates', () => {
  describe('orderConfirmation', () => {
    it('should render order confirmation with items table', () => {
      const html = emailTemplates.orderConfirmation({
        customerName: 'Jane Doe',
        orderRef: 'ORD-001',
        totalFormatted: '$129.99',
        items: [
          { name: 'Widget A', quantity: 2, priceFormatted: '$49.99' },
          { name: 'Widget B', quantity: 1, priceFormatted: '$30.01' },
        ],
      });

      expect(html).toContain('Order Confirmed');
      expect(html).toContain('Jane Doe');
      expect(html).toContain('ORD-001');
      expect(html).toContain('$129.99');
      expect(html).toContain('Widget A');
      expect(html).toContain('Widget B');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('EcomSaaS');
    });

    it('should include order URL button when provided', () => {
      const html = emailTemplates.orderConfirmation({
        customerName: 'Jane',
        orderRef: 'ORD-002',
        totalFormatted: '$50.00',
        items: [{ name: 'Item', quantity: 1, priceFormatted: '$50.00' }],
        orderUrl: 'https://shop.example.com/orders/ORD-002',
      });

      expect(html).toContain('View Order');
      expect(html).toContain('https://shop.example.com/orders/ORD-002');
    });

    it('should not include button when orderUrl is absent', () => {
      const html = emailTemplates.orderConfirmation({
        customerName: 'Jane',
        orderRef: 'ORD-003',
        totalFormatted: '$10.00',
        items: [{ name: 'Item', quantity: 1, priceFormatted: '$10.00' }],
      });

      expect(html).not.toContain('View Order');
    });

    it('should reject javascript: URL scheme', () => {
      const html = emailTemplates.orderConfirmation({
        customerName: 'Jane',
        orderRef: 'ORD-JS',
        totalFormatted: '$10.00',
        items: [{ name: 'Item', quantity: 1, priceFormatted: '$10.00' }],
        orderUrl: 'javascript:alert(1)',
      });

      expect(html).not.toContain('View Order');
      expect(html).not.toContain('javascript:');
    });

    it('should reject data: URL scheme', () => {
      const html = emailTemplates.orderConfirmation({
        customerName: 'Jane',
        orderRef: 'ORD-DATA',
        totalFormatted: '$10.00',
        items: [{ name: 'Item', quantity: 1, priceFormatted: '$10.00' }],
        orderUrl: 'data:text/html,<script>alert(1)</script>',
      });

      expect(html).not.toContain('View Order');
    });

    it('should escape HTML in user-provided data', () => {
      const html = emailTemplates.orderConfirmation({
        customerName: '<script>alert("xss")</script>',
        orderRef: 'ORD-XSS',
        totalFormatted: '$0',
        items: [{ name: '<img onerror="alert(1)" />', quantity: 1, priceFormatted: '$0' }],
      });

      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<img');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&lt;img');
    });

    it('should include preheader text', () => {
      const html = emailTemplates.orderConfirmation({
        customerName: 'Jane',
        orderRef: 'ORD-PH',
        totalFormatted: '$25.00',
        items: [{ name: 'Item', quantity: 1, priceFormatted: '$25.00' }],
      });

      expect(html).toContain('display:none');
      expect(html).toContain('ORD-PH');
    });
  });

  describe('orderStatusUpdate', () => {
    it('should render status transition', () => {
      const html = emailTemplates.orderStatusUpdate({
        customerName: 'John',
        orderRef: 'ORD-100',
        previousStatus: 'Processing',
        newStatus: 'Shipped',
      });

      expect(html).toContain('Order Update');
      expect(html).toContain('John');
      expect(html).toContain('ORD-100');
      expect(html).toContain('Processing');
      expect(html).toContain('Shipped');
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should include optional message', () => {
      const html = emailTemplates.orderStatusUpdate({
        customerName: 'John',
        orderRef: 'ORD-101',
        previousStatus: 'Shipped',
        newStatus: 'Delivered',
        message: 'Left at front door',
      });

      expect(html).toContain('Left at front door');
    });

    it('should include order URL when provided', () => {
      const html = emailTemplates.orderStatusUpdate({
        customerName: 'John',
        orderRef: 'ORD-102',
        previousStatus: 'Pending',
        newStatus: 'Confirmed',
        orderUrl: 'https://shop.example.com/orders/102',
      });

      expect(html).toContain('View Order');
      expect(html).toContain('https://shop.example.com/orders/102');
    });

    it('should escape HTML in status values', () => {
      const html = emailTemplates.orderStatusUpdate({
        customerName: 'John',
        orderRef: 'ORD-103',
        previousStatus: '<b>old</b>',
        newStatus: '<i>new</i>',
        message: '<script>xss</script>',
      });

      expect(html).not.toContain('<b>old</b>');
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;b&gt;');
    });
  });
});

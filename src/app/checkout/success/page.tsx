/**
 * Checkout Success Page
 *
 * Displays order confirmation after successful Stripe checkout
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Package, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/lib/cart/store';
import { toast } from 'sonner';

interface OrderDetails {
  orderNumber: string;
  orderId: string;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  currency: string;
  items: Array<{
    id: string;
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
    thumbnailUrl: string;
  }>;
  shippingAddress?: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    stateCode: string;
    countryCode: string;
    zip: string;
  };
}

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();

  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('No session ID found. Please complete checkout first.');
      setLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/stripe/session/${sessionId}`);

        if (!response.ok) {
          throw new Error('Failed to retrieve order details');
        }

        const data = await response.json();

        // Extract order details from Stripe session and database order
        const order = data.order;
        const session = data.session;

        setOrderDetails({
          orderNumber: order.orderNumber,
          orderId: order.id,
          total: order.total,
          subtotal: order.subtotal,
          shipping: order.shipping,
          tax: order.tax,
          currency: order.currency,
          items: order.items.map((item: any) => ({
            id: item.id,
            productName: item.productName,
            variantName: item.variantName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            thumbnailUrl: item.thumbnailUrl,
          })),
          shippingAddress: order.shippingAddress
            ? {
                name: order.shippingAddress.name,
                address1: order.shippingAddress.address1,
                address2: order.shippingAddress.address2,
                city: order.shippingAddress.city,
                stateCode: order.shippingAddress.stateCode,
                countryCode: order.shippingAddress.countryCode,
                zip: order.shippingAddress.zip,
              }
            : session.shipping_details?.address
              ? {
                  name: session.shipping_details.name || session.customer_name || 'Customer',
                  address1: session.shipping_details.address.line1 || '',
                  address2: session.shipping_details.address.line2,
                  city: session.shipping_details.address.city || '',
                  stateCode: session.shipping_details.address.state || '',
                  countryCode: session.shipping_details.address.country || '',
                  zip: session.shipping_details.address.postal_code || '',
                }
              : undefined,
        });

        // Clear cart after successful order
        clearCart();

        // Show success toast
        toast.success('Order placed successfully!', {
          description: `Order ${order.orderNumber} has been confirmed.`,
        });
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [searchParams, clearCart]);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-lg text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Order Not Found</CardTitle>
            <CardDescription>{error || 'Unable to load order details'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/products')} className="w-full">
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Success Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Order Confirmed!</h1>
        <p className="mt-2 text-lg text-gray-600">
          Thank you for your order. We&apos;ve received your payment and will begin processing your
          order shortly.
        </p>
      </div>

      {/* Order Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order {orderDetails.orderNumber}</CardTitle>
              <CardDescription>Order placed successfully</CardDescription>
            </div>
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Items */}
          <div>
            <h3 className="mb-3 font-semibold text-gray-900">Order Items</h3>
            <div className="space-y-3">
              {orderDetails.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-sm text-gray-600">{item.variantName}</p>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-medium text-gray-900">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Shipping Address */}
          {orderDetails.shippingAddress && (
            <>
              <div>
                <h3 className="mb-2 font-semibold text-gray-900">Shipping Address</h3>
                <div className="text-sm text-gray-600">
                  <p>{orderDetails.shippingAddress.name}</p>
                  <p>{orderDetails.shippingAddress.address1}</p>
                  {orderDetails.shippingAddress.address2 && (
                    <p>{orderDetails.shippingAddress.address2}</p>
                  )}
                  <p>
                    {orderDetails.shippingAddress.city}, {orderDetails.shippingAddress.stateCode}{' '}
                    {orderDetails.shippingAddress.zip}
                  </p>
                  <p>{orderDetails.shippingAddress.countryCode}</p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Order Totals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">
                {formatPrice(orderDetails.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="font-medium text-gray-900">
                {formatPrice(orderDetails.shipping)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium text-gray-900">{formatPrice(orderDetails.tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-gray-900">{formatPrice(orderDetails.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Button variant="outline" onClick={() => router.push('/products')}>
          Continue Shopping
        </Button>
        <Button onClick={() => router.push(`/orders/${orderDetails.orderId}`)}>
          Track Order
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Email Confirmation Notice */}
      <p className="mt-6 text-center text-sm text-gray-500">
        A confirmation email with order details has been sent to your email address.
      </p>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[600px] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}

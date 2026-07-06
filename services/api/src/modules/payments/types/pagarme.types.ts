export interface PagarmeCreatePixOrderInput {
  code: string;
  amount: number;
  description: string;
  eventId: string;
  customerName: string;
  customerEmail: string;
  metadata: {
    paymentId: string;
    registrationId: string;
    eventId: string;
    userId: string;
  };
}

export interface PagarmeOrderResponse {
  id: string;
  code: string;
  status: string;
  created_at: string;
  updated_at: string;
  charges: Array<{
    id: string;
    code: string;
    status: string;
    amount: number;
    payment_method: string;
    last_transaction: {
      transaction_type: string;
      qr_code: string;
      qr_code_url: string;
      expires_at: string;
      success: boolean;
    };
  }>;
}

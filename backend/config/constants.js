module.exports = {
  ROLES: {
    ADMIN: 'admin',
    MANUFACTURER: 'manufacturer',
    DISTRIBUTOR: 'distributor',
    PHARMACY: 'pharmacy',
    HOSPITAL: 'hospital',
  },
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    RETURNED: 'returned',
  },
  PRODUCT_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DISCONTINUED: 'discontinued',
    OUT_OF_STOCK: 'out_of_stock',
  },
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    OVERDUE: 'overdue',
    PARTIALLY_PAID: 'partially_paid',
  },
};

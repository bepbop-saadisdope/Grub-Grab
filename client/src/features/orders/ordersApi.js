import client from '../../api/client.js';

const MAX_QTY = 99;

export const placeOrder = ({
  fullName,
  phoneNumber,
  deliveryAddress,
  deliveryCity,
  specialInstructions,
  items,
}) => {
  const body = {
    fullName: String(fullName).trim(),
    phoneNumber: String(phoneNumber).trim(),
    deliveryAddress: String(deliveryAddress).trim(),
    items: items.map((i) => ({
      menuItemId: Number(i.MenuItemID),
      quantity: Math.max(
        1,
        Math.min(MAX_QTY, Math.floor(Number(i.qty) || 1))
      ),
    })),
  };

  if (deliveryCity && String(deliveryCity).trim()) {
    body.deliveryCity = String(deliveryCity).trim();
  }
  if (specialInstructions && String(specialInstructions).trim()) {
    body.specialInstructions = String(specialInstructions).trim();
  }

  return client.post('/api/orders', body).then((r) => r.data.data);
};

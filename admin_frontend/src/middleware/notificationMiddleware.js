import notificationSound from '../assets/audio/web_whatsapp.mp3';

let lastOrderId = null;

const playNotification = () => {
  const audio = new Audio(notificationSound);
  audio.play();
};

const notificationMiddleware = store => next => action => {
  if (action.type === 'order/fetchNewOrders/fulfilled') {
    const orders = action.payload.orders;

    if (orders.length > 0) {
      const currentOrderId = orders[0].id;

      if (lastOrderId === null) {
        lastOrderId = currentOrderId;
      } else if (currentOrderId > lastOrderId) {
        playNotification();
        lastOrderId = currentOrderId;
      }
    }
  }

  return next(action);
};

export default notificationMiddleware;

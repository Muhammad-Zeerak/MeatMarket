import { createSlice } from "@reduxjs/toolkit";
import { CartProduct } from "interfaces";
import { RootState } from "redux/store";

type CartType = {
  cartItems: CartProduct[];
};

const initialState: CartType = {
  cartItems: [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart(state, action) {
      const { payload } = action;
      const existingIndex = state.cartItems.findIndex(
        (item) => item.stock.id === payload.stock?.id,
      );
      if (existingIndex >= 0) {
        state.cartItems[existingIndex].quantity += payload.quantity;
      } else {
        state.cartItems.push(payload);
      }
    },
    setToCart(state, action) {
      const { payload } = action;
      const existingIndex = state.cartItems.findIndex(
        (item) => item.stock.id === payload.stock?.id,
      );
      if (existingIndex >= 0) {
        state.cartItems[existingIndex] = payload;
      } else {
        state.cartItems.push(payload);
      }
    },
    reduceCartItem(state, action) {
      const itemIndex = state.cartItems.findIndex(
        (item) => item.stock.id === action.payload.stock?.id,
      );

      if (state.cartItems[itemIndex].quantity > 1) {
        state.cartItems[itemIndex].quantity -= 1;
      }
    },
    removeFromCart(state, action) {
      state.cartItems.map((cartItem) => {
        if (cartItem.stock.id === action.payload.stock?.id) {
          const nextCartItems = state.cartItems.filter(
            (item) => item.stock.id !== cartItem.stock.id,
          );
          state.cartItems = nextCartItems;
        }
        return state;
      });
    },
    updateCartQuantity(state, action) {
      const { payload } = action;
      state.cartItems.forEach((cartItem, index) => {
        const existingIndex = payload.find(
          (item: { stock_id: number }) => item.stock_id === cartItem.stock.id,
        );

        if (!!existingIndex) {
          state.cartItems[index].quantity = existingIndex.quantity;
        }
      });
    },
    clearCart(state) {
      state.cartItems = [];
    },
    updateCart(state, action) {
      state.cartItems = action.payload;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  clearCart,
  reduceCartItem,
  setToCart,
  updateCartQuantity,
  updateCart,
} = cartSlice.actions;

export const selectCart = (state: RootState) => state.cart.cartItems;
export const selectTotalPrice = (state: RootState) =>
  state.cart.cartItems.reduce((total, item) => {
    const addonsTotalPrice = item.addons.length
      ? item.addons.reduce(
          (total, addon) =>
            (total += addon.quantity * Number(addon.stock.total_price)),
          0,
        )
      : 0;

    return (total +=
      item.quantity * Number(item.stock.total_price) + addonsTotalPrice);
  }, 0);
export default cartSlice.reducer;

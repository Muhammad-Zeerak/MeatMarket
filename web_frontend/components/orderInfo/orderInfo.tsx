import React, { useEffect } from "react";
import { Order } from "interfaces";
import cls from "./orderInfo.module.scss";
import { useTranslation } from "react-i18next";
import PhoneFillIcon from "remixicon-react/PhoneFillIcon";
import Chat1FillIcon from "remixicon-react/Chat1FillIcon";
import DarkButton from "components/button/darkButton";
import SecondaryButton from "components/button/secondaryButton";
import CustomerService2FillIcon from "remixicon-react/CustomerService2FillIcon";
import RepeatOneFillIcon from "remixicon-react/RepeatOneFillIcon";
import Price from "components/price/price";
import dayjs from "dayjs";
import dynamic from "next/dynamic";
import useModal from "hooks/useModal";
import orderService from "services/order";
import { useMutation } from "react-query";
import { error, success } from "components/alert/toast";
import { useRouter } from "next/router";
import cartService from "services/cart";
import { useAppDispatch, useAppSelector } from "hooks/useRedux";
import {
  clearUserCart,
  selectUserCart,
  updateUserCart,
} from "redux/slices/userCart";
import calculateOrderSubTotal from "utils/calculateOrderSubTotal";
import Chat from "components/chat/chat";
import Avatar from "components/avatar";

const ConfirmationModal = dynamic(
  () => import("components/confirmationModal/confirmationModal")
);
const OrderRefund = dynamic(
  () => import("containers/orderRefundContainer/orderRefundContainer")
);
const DrawerContainer = dynamic(() => import("containers/drawer/drawer"));

type Props = {
  data?: Order;
};

export default function OrderInfo({ data }: Props) {
  const { t } = useTranslation();
  const { push, query } = useRouter();
  const dispatch = useAppDispatch();
  const cart = useAppSelector(selectUserCart);
  const [openModal, handleOpen, handleClose] = useModal();
  const [openChat, handleOpenChat, handleCloseChat] = useModal();
  const canRefund = !data?.order_refunds?.some(
    (item) => item.status === "approved" || item.status === "pending"
  );
  const subTotal = calculateOrderSubTotal(data);

  const { mutate: orderCancel, isLoading } = useMutation({
    mutationFn: () => orderService.cancel(data?.id || 0),
    onSuccess: () => {
      handleClose();
      push("/orders");
      success(t("order.cancelled"));
    },
    onError: (err: any) => error(err?.statusCode),
  });

  const { isLoading: loadingRepeatOrder, mutate: insertProducts } = useMutation(
    {
      mutationFn: (data: any) => cartService.insert(data),
      onSuccess: (data) => {
        dispatch(updateUserCart(data.data));
        push(`/checkout/${data.data.shop_id}`);
      },
      onError: () => {
        error(t("error.400"));
      },
    }
  );

  const { isLoading: isLoadingClearCart, mutate: mutateClearCart } =
    useMutation({
      mutationFn: (data: any) => cartService.delete(data),
      onSuccess: () => {
        dispatch(clearUserCart());
        repeatOrder();
      },
    });

  function repeatOrder() {
    if (!checkIsAbleToAddProduct()) {
      mutateClearCart({ ids: [cart.id] });
      return;
    }
    let products: any[] = [];
    data?.details.forEach((item) => {
      const addons = item.addons.map((el) => ({
        stock_id: el.stock.id,
        quantity: el.quantity,
        parent_id: item.stock.id,
      }));
      if (!item.bonus) {
        products.push({
          stock_id: item.stock.id,
          quantity: item.quantity,
        });
      }
      products.push(...addons);
    });
    const payload = {
      shop_id: data?.shop.id,
      currency_id: data?.currency?.id,
      rate: data?.rate,
      products,
    };
    insertProducts(payload);
  }

  function checkIsAbleToAddProduct() {
    return cart.shop_id === 0 || cart.shop_id === data?.shop.id;
  }

  // run to check if transaction is success before component mounts
  useEffect(() => {
    console.log('data on info',data)
    async function fetchPaymentStatus() {
      const tapId = Array.isArray(query.tap_id) ? query.tap_id[0] : query.tap_id;
      const orderId = data?.id;
      if (tapId && orderId) {
        try {
          // call charge details api to see if transaction is success
          // if transaction successfull then this api changes transaction state in website
          const response = await orderService.getChargeDetails(tapId, orderId);
          // a notification - used gained points
          if (response.data.original.status == 'CAPTURED' && response.data.original.metadata.points_claimed == 'false') {
            success(`You have earned ${response.data.original.metadata.order_price} points.`);
          }
        } catch (error) {
          console.error("Error fetching payment status:", error);
        }
      }
    }

    fetchPaymentStatus();
  }, [query.tap_id, data?.id]);

  return (
    <div className={cls.wrapper}>
      <div className={cls.header}>
        <div>
          <h4 className={cls.title}>{t("order")}</h4>
          <div className={cls.subtitle}>
            <span className={cls.text}>#{data?.id}</span>
            <span className={cls.dot} />
            <span className={cls.text}>
              {dayjs(data?.created_at).format("MMM DD, HH:mm")}
            </span>
          </div>
        </div>
        {data?.status === "delivered" && canRefund && <OrderRefund />}
      </div>
      <div className={cls.address}>
        {data?.delivery_type === "pickup" ? (
          <label>{t("pickup.address")}</label>
        ) : (
          <label>{t("delivery.address")}</label>
        )}
        <h6 className={cls.text}>{data?.address?.address}</h6>
        <br />
        {data?.delivery_type === "pickup" ? (
          <label>{t("pickup.time")}</label>
        ) : (
          <label>{t("delivery.time")}</label>
        )}
        <h6 className={cls.text}>
          {dayjs(data?.delivery_date).format("ddd, MMM DD,")}{" "}
          {data?.delivery_time}
        </h6>
        <br />
        <label>{t("payment.type")}</label>
        <h6 className={cls.text} style={{ textTransform: "capitalize" }}>
          {t(data?.transaction?.payment_system.tag)}
        </h6>
        <br />
        <label>{t("payment.status")}</label>
        <h6 className={cls.text} style={{ textTransform: "capitalize" }}>
          {t(data?.transaction?.status)}
        </h6>
      </div>
      <div className={cls.body}>
        <div className={cls.flex}>
          <label>{t("subtotal")}</label>
          <span className={cls.price}>
            <Price
              number={data?.origin_price}
              symbol={data?.currency?.symbol}
            />
          </span>
        </div>
        <div className={cls.flex}>
          <label>{t("delivery.price")}</label>
          <span className={cls.price}>
            {data?.origin_price ?? 0 >= (data?.max_cap_free_delivery ?? 0) ? (
              "FREE"
            ) : (
              <Price
                number={data?.delivery_fee}
                symbol={data?.currency?.symbol}
              />
            )}
          </span>
        </div>
        <div className={cls.flex}>
          <label>{t("shop.tax")}</label>
          <span className={cls.price}>
            <Price
              number={data?.tax}
              symbol={data?.currency?.symbol}
              position={data?.currency?.position}
            />
          </span>
        </div>
        <div className={cls.flex}>
          <label>{t("discount")}</label>
          <span className={cls.discount}>
            <Price
              number={data?.total_discount}
              minus
              symbol={data?.currency?.symbol}
            />
          </span>
        </div>

        <div className={cls.flex}>
          <label>{"Fixed amount"}</label>
          <span className={cls.price}>
            <Price
              number={data?.fixed_amount}
              symbol={data?.currency?.symbol}
            />
          </span>
        </div>

        {!!data?.coupon && (
          <div className={cls.flex}>
            <label>{t("promo.code")}</label>
            <span className={cls.discount}>
              <Price
                number={data.coupon.price}
                minus
                symbol={data.currency?.symbol}
              />
            </span>
          </div>
        )}
        {data?.redeemPoints ? (
          <div className={cls.flex}>
            <label>{t("redeem.points")}</label>
            <span className={cls.discount}>
              <Price
                number={data.redeemPoints / 100}
                minus
                symbol={data.currency?.symbol}
              />
            </span>
          </div>
        ) : (
          ""
        )}
        <div className={cls.flex}>
          <label>{t("total")}</label>
          <span className={cls.totalPrice}>
            <Price number={data?.total_price} symbol={data?.currency?.symbol} />
          </span>
        </div>
      </div>
      {data?.deliveryman ? (
        <div className={cls.courierBlock}>
          <div className={cls.courier}>
            <div className={cls.avatar}>
              <div className={cls.imgWrapper}>
                <Avatar data={data.deliveryman} />
              </div>
              {/* <span className={cls.rating}>4.5</span> */}
            </div>
            <div className={cls.naming}>
              <h5 className={cls.name}>
                {data.deliveryman.firstname}{" "}
                {data.deliveryman.lastname?.charAt(0)}.
              </h5>
              <p className={cls.text}>{t("driver")}</p>
            </div>
          </div>
          <div className={cls.actions}>
            <a href={`tel:${data.deliveryman.phone}`} className={cls.iconBtn}>
              <PhoneFillIcon />
            </a>
            <button className={cls.iconBtn} onClick={handleOpenChat}>
              <Chat1FillIcon />
            </button>
          </div>
        </div>
      ) : (
        ""
      )}
      {data?.status === "new" ? (
        <div className={cls.footer}>
          <SecondaryButton type="button" onClick={handleOpen}>
            {t("cancel.order")}
          </SecondaryButton>
        </div>
      ) : data?.status === "delivered" || data?.status === "canceled" ? (
        <div className={cls.footer}>
          <a
            href={`tel:${data.shop.phone}`}
            style={{ display: "block", width: "100%" }}
          >
            <DarkButton icon={<CustomerService2FillIcon />} type="button">
              {t("support")}
            </DarkButton>
          </a>
          <SecondaryButton
            icon={<RepeatOneFillIcon />}
            type="button"
            onClick={repeatOrder}
            loading={isLoadingClearCart || loadingRepeatOrder}
          >
            {t("repeat.order")}
          </SecondaryButton>
        </div>
      ) : (
        ""
      )}

      <ConfirmationModal
        open={openModal}
        handleClose={handleClose}
        onSubmit={orderCancel}
        loading={isLoading}
        title={t("are.you.sure.cancel.order")}
      />

      <DrawerContainer
        open={openChat}
        onClose={handleCloseChat}
        PaperProps={{ style: { padding: 0 } }}
      >
        <Chat />
      </DrawerContainer>
    </div>
  );
}

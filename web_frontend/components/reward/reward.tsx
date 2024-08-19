import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import cls from "./reward.module.scss";
import PrimaryButton from "components/button/primaryButton";
import TextInput from "components/inputs/textInput";
import { DoubleCheckIcon } from "components/icons";
import SecondaryButton from "components/button/secondaryButton";
import { FormikProps } from "formik";
import { OrderFormValues } from "interfaces";
import useDebounce from "hooks/useDebounce";
import { useMutation } from "react-query";
import useDidUpdate from "hooks/useDidUpdate";
import { useAuth } from "contexts/auth/auth.context";
import { useRouter } from "next/router";
import { CircularProgress } from "@mui/material";
import { error, success } from "components/alert/toast";

type Props = {
  formik: FormikProps<OrderFormValues>;
  handleClose: () => void;
};

interface RedeemResponse {
  success: boolean;
  message: string;
}

export default function Reward({ formik, handleClose }: Props) {
  const { t } = useTranslation();
  const [isValid, setIsValid] = useState(false);
  const [value, setValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const debouncedValue = useDebounce(value, 400);
  const { user } = useAuth();
  const { query } = useRouter();
  const shopId = Number(query.id);

  const { mutate, isLoading } = useMutation({
    mutationFn: (data: any) => {
      return new Promise<RedeemResponse>((resolve, reject) => {
        const pointsToRedeem = Number(data.redeemPoints);
        const userPointsBalance = user.points_balance || 0;
        if (pointsToRedeem > userPointsBalance) {
          reject(new Error("Insufficient points balance."));
        } else if (pointsToRedeem < 25) {
          reject(new Error("You cannot redeem less than 25 points."));
        } else {
          setTimeout(() => {
            resolve({ success: true, message: "Points redeemed successfully." });
          }, 1000);
        }
      });
    },
    onSuccess: (response: RedeemResponse) => {
      const { success, message } = response;
      if (success) {
        setIsValid(true);
        formik.setFieldValue("redeemPoints", Number(debouncedValue));
        handleClose();
      }
    },
    onError: (err: any) => {
      console.log(err);
    },
  });
  
  useDidUpdate(() => {
    const pointsToRedeem = Number(debouncedValue);
    const userPointsBalance = user.points_balance || 0;
    if (!debouncedValue) {
      setIsValid(false);
      setErrorMessage("");
    } else if (pointsToRedeem > userPointsBalance) {
      setIsValid(false);
      setErrorMessage("Insufficient points balance.");
    } else if (pointsToRedeem < 25) {
      setIsValid(false);
      setErrorMessage("You cannot redeem less than 25 points.");
    } else {
      setIsValid(true);
      setErrorMessage("");
    }
  }, [debouncedValue]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const handleSubmit = () => {
    mutate({
      redeemPoints: debouncedValue,
      user_id: user.id,
      shop_id: shopId,
    });
  };

  return (
    <div className={cls.wrapper}>
      <div className={cls.body}>
        <TextInput
          label={t("redeem.points")}
          name="redeemPoints"
          onChange={handleChange}
          value={value}
          InputProps={{
            endAdornment: isLoading ? (
              <CircularProgress size={22} />
            ) : isValid ? (
              <DoubleCheckIcon />
            ) : (
              ""
            ),
          }}
          error={!isValid && !!debouncedValue && !isLoading}
          helperText={!isValid && !!debouncedValue && errorMessage ? errorMessage : ""}
        />
      </div>
      <div className={cls.footer}>
        <div className={cls.action}>
          <PrimaryButton
            disabled={!isValid || isLoading}
            onClick={handleSubmit}
          >
            {t("save")}
          </PrimaryButton>
        </div>
        <div className={cls.action}>
          <SecondaryButton onClick={() => setValue("")}>
            {t("clear")}
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}

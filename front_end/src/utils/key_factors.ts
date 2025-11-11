import { KeyFactor } from "@/types/comment";
import {
  BaseRateDraft,
  DriverDraft,
  KeyFactorDraft,
} from "@/types/key_factors";

export const isDriverDraft = (d: KeyFactorDraft): d is DriverDraft =>
  !!d.driver;

export const isBaseRateDraft = (d: KeyFactorDraft): d is BaseRateDraft =>
  !!d.base_rate;

export const isDriverKF = (kf: KeyFactor) => !!kf.driver && !kf.base_rate;
export const isBaseRateKF = (kf: KeyFactor) => !!kf.base_rate && !kf.driver;

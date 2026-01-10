import { KeyFactor } from "@/types/comment";
import {
  BaseRateDraft,
  DriverDraft,
  KeyFactorDraft,
  NewsDraft,
} from "@/types/key_factors";

export const isDriverDraft = (d: KeyFactorDraft): d is DriverDraft =>
  !!(d as DriverDraft).driver;
export const isBaseRateDraft = (d: KeyFactorDraft): d is BaseRateDraft =>
  !!(d as BaseRateDraft).base_rate;
export const isNewsDraft = (d: KeyFactorDraft): d is NewsDraft =>
  !!(d as NewsDraft).news;

export const isDriverKF = (kf: KeyFactor) =>
  !!kf.driver && !kf.base_rate && !kf.news;
export const isBaseRateKF = (kf: KeyFactor) =>
  !!kf.base_rate && !kf.driver && !kf.news;
export const isNewsKF = (kf: KeyFactor) =>
  !!kf.news && !kf.driver && !kf.base_rate;

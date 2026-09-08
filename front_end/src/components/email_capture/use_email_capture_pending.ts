"use client";

import { useSyncExternalStore } from "react";

import { readPending, subscribePending } from "./pending_store";

const getServerSnapshot = () => null;

const useEmailCapturePending = () =>
  useSyncExternalStore(subscribePending, readPending, getServerSnapshot);

export default useEmailCapturePending;

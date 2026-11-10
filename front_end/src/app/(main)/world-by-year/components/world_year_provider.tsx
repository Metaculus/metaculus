"use client";

import {
  createContext,
  FC,
  PropsWithChildren,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  clampYear,
  INITIAL_YEAR,
  PLAY_END_YEAR,
  YEAR_MIN,
} from "../helpers/forecast";

const PLAY_STEP_MS = 1000;

export const SETTLE_AFTER_ARROW_MS = 600;
export const SETTLE_AFTER_KEY_MS = 650;
export const SETTLE_AFTER_EDGE_KEY_MS = 400;

// "hero" drags follow the year live in the timeline, so nothing waits on them.
export type PendingSource = "drag" | "key" | "hero";

type WorldYearContextValue = {
  // Follows every control live; the hero timeline and charts read it.
  year: number;
  // Catches up once a drag is released or a burst of arrow presses pauses;
  // prose and other heavy content read it.
  settledYear: number;
  settleCount: number;
  scrubbing: boolean;
  pendingSource: PendingSource;
  playing: boolean;
  holdRef: RefObject<boolean>;
  changeYear: (year: number, settleAfterMs?: number) => void;
  changeScrubbing: (scrubbing: boolean, source?: PendingSource) => void;
  togglePlay: () => void;
};

const WorldYearContext = createContext<WorldYearContextValue | null>(null);

export const WorldYearProvider: FC<PropsWithChildren> = ({ children }) => {
  const [year, setYear] = useState(INITIAL_YEAR);
  const [settledYear, setSettledYear] = useState(INITIAL_YEAR);
  const [settleCount, setSettleCount] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [pendingSource, setPendingSource] = useState<PendingSource>("key");
  const [playing, setPlaying] = useState(false);
  const holdRef = useRef(false);
  const yearRef = useRef(INITIAL_YEAR);
  const settledRef = useRef(INITIAL_YEAR);
  const draggingRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const setPending = useCallback((value: boolean) => {
    holdRef.current = value;
    setScrubbing(value);
  }, []);

  const settle = useCallback(() => {
    clearTimeout(settleTimerRef.current);
    setPending(false);
    if (settledRef.current === yearRef.current) return;
    settledRef.current = yearRef.current;
    setSettledYear(yearRef.current);
    setSettleCount((count) => count + 1);
  }, [setPending]);

  const applyYear = useCallback((next: number) => {
    yearRef.current = next;
    setYear(next);
  }, []);

  const changeYear = useCallback(
    (next: number, settleAfterMs?: number) => {
      setPlaying(false);
      applyYear(clampYear(next));
      if (draggingRef.current) return;
      clearTimeout(settleTimerRef.current);
      if (settleAfterMs == null) {
        settle();
        return;
      }
      setPendingSource("key");
      setPending(true);
      settleTimerRef.current = setTimeout(settle, settleAfterMs);
    },
    [applyYear, settle, setPending]
  );

  const changeScrubbing = useCallback(
    (value: boolean, source: PendingSource = "drag") => {
      draggingRef.current = value;
      if (!value) {
        settle();
        return;
      }
      clearTimeout(settleTimerRef.current);
      setPendingSource(source);
      setPending(true);
    },
    [settle, setPending]
  );

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      applyYear(yearRef.current + 1);
      settle();
      if (yearRef.current >= PLAY_END_YEAR) setPlaying(false);
    }, PLAY_STEP_MS);
    return () => clearTimeout(timer);
  }, [playing, year, applyYear, settle]);

  useEffect(() => () => clearTimeout(settleTimerRef.current), []);

  const togglePlay = useCallback(() => {
    if (playing) {
      setPlaying(false);
      return;
    }
    const next =
      (yearRef.current >= PLAY_END_YEAR ? YEAR_MIN : yearRef.current) + 1;
    applyYear(next);
    settle();
    setPlaying(next < PLAY_END_YEAR);
  }, [playing, applyYear, settle]);

  const value = useMemo(
    () => ({
      year,
      settledYear,
      settleCount,
      scrubbing,
      pendingSource,
      playing,
      holdRef,
      changeYear,
      changeScrubbing,
      togglePlay,
    }),
    [
      year,
      settledYear,
      settleCount,
      scrubbing,
      pendingSource,
      playing,
      changeYear,
      changeScrubbing,
      togglePlay,
    ]
  );

  return (
    <WorldYearContext.Provider value={value}>
      {children}
    </WorldYearContext.Provider>
  );
};

export const useWorldYear = () => {
  const context = useContext(WorldYearContext);
  if (!context) {
    throw new Error("useWorldYear must be used within WorldYearProvider");
  }
  return context;
};

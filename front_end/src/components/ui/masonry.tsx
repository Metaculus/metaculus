import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";

export function useGridStyles(columns: number, gap: number) {
  return useMemo(
    () => ({
      display: "grid",
      alignItems: "start",
      gridColumnGap: gap,
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    }),
    [columns, gap]
  );
}

export function useMediaValues(
  medias: number[] | undefined,
  columns: number[],
  gap: number[]
) {
  const [values, setValues] = useState({
    columns: columns[0] ?? 1,
    gap: gap[0] ?? 12,
  });

  useEffect(() => {
    if (!medias) {
      setValues({ columns: columns[0] ?? 1, gap: gap[0] ?? 12 });
      return;
    }

    const mediaQueries = medias.map((media) =>
      window.matchMedia(`(min-width: ${media}px)`)
    );

    const onSizeChange = () => {
      let matches = 0;

      mediaQueries.forEach((mediaQuery) => {
        if (mediaQuery.matches) {
          matches++;
        }
      });

      // Update Values
      const idx = Math.min(mediaQueries.length - 1, Math.max(0, matches));
      setValues({ columns: columns[idx] ?? 0, gap: gap[idx] ?? 0 });
    };

    // Initial Call
    onSizeChange();

    // Apply Listeners
    for (const mediaQuery of mediaQueries) {
      mediaQuery.addEventListener("change", onSizeChange);
    }

    return () => {
      for (const mediaQuery of mediaQueries) {
        mediaQuery.removeEventListener("change", onSizeChange);
      }
    };
  }, [medias, columns, gap]);

  return values;
}

export function asList(data: number | number[]) {
  return Array.isArray(data) ? data : [data];
}

export type MasonryProps<T> = React.ComponentPropsWithoutRef<"div"> & {
  items: T[];
  render: (item: T) => React.ReactNode;
  config: {
    columns: number | number[];
    gap: number | number[];
    media?: number[];
    useBalancedLayout?: boolean;
  };
  as?: React.ElementType;
};

export function Masonry<T>({
  items = [],
  render,
  config,
  as: Component = "div",
  ...rest
}: MasonryProps<T>) {
  const _columns = useMemo(() => asList(config.columns), [config.columns]);
  const _gaps = useMemo(() => asList(config.gap), [config.gap]);
  const { columns, gap } = useMediaValues(config.media, _columns, _gaps);
  const styles = useGridStyles(columns, gap);

  if (!columns) return null;

  if (config.useBalancedLayout) {
    return (
      <BalancedMasonry
        items={items}
        render={render}
        columns={columns}
        gap={gap}
        styles={styles}
        as={Component}
        {...rest}
      />
    );
  }

  const dataColumns = createDataColumns(createChunks(items, columns), columns);

  return (
    <Component {...rest} style={styles}>
      {dataColumns.map((column, columnIdx) => (
        <MasonryRow gap={gap} key={columnIdx}>
          {column.map((item, idx) => (
            <div key={idx}>{render(item)}</div>
          ))}
        </MasonryRow>
      ))}
    </Component>
  );
}

function BalancedMasonry<T>({
  items,
  render,
  columns,
  gap,
  styles,
  as: Component = "div",
  ...rest
}: {
  items: T[];
  render: (item: T) => React.ReactNode;
  columns: number;
  gap: number;
  styles: React.CSSProperties;
  as?: React.ElementType;
} & React.ComponentPropsWithoutRef<"div">) {
  const columnAssignments = useRef<Map<T, number>>(new Map());
  const measuredHeights = useRef<Map<T, number>>(new Map());
  const prevColumnCount = useRef<number>(columns);
  const [placementGeneration, setPlacementGeneration] = useState(0);

  // Breakpoint change: clear everything for full redistribution
  if (columns !== prevColumnCount.current) {
    columnAssignments.current.clear();
    measuredHeights.current.clear();
    prevColumnCount.current = columns;
  }

  // Stale cleanup: remove items no longer in the array
  const itemSet = new Set(items);
  for (const key of columnAssignments.current.keys()) {
    if (!itemSet.has(key)) {
      columnAssignments.current.delete(key);
      measuredHeights.current.delete(key);
    }
  }
  for (const key of measuredHeights.current.keys()) {
    if (!itemSet.has(key)) {
      measuredHeights.current.delete(key);
    }
  }

  const placedItems: T[] = [];
  const pendingItems: T[] = [];
  for (const item of items) {
    if (columnAssignments.current.has(item)) {
      placedItems.push(item);
    } else {
      pendingItems.push(item);
    }
  }

  // Build columns for placed items
  const placedColumns: T[][] = Array.from({ length: columns }, () => []);
  for (const item of placedItems) {
    const col = columnAssignments.current.get(item) ?? 0;
    if (placedColumns[col]) {
      placedColumns[col].push(item);
    }
  }

  const pendingMeasureRef = useCallback(
    (node: HTMLDivElement | null, item: T) => {
      if (node) {
        const height = node.getBoundingClientRect().height;
        measuredHeights.current.set(item, height);
      }
    },
    []
  );

  // Place pending items once all are measured
  useEffect(() => {
    if (pendingItems.length === 0) return;

    const allMeasured = pendingItems.every((item) =>
      measuredHeights.current.has(item)
    );
    if (!allMeasured) return;

    // Compute current column heights from placed items
    const currentColumnHeights = new Array(columns).fill(0);
    for (const item of placedItems) {
      const col = columnAssignments.current.get(item) ?? 0;
      currentColumnHeights[col] += measuredHeights.current.get(item) ?? 0;
    }

    // Distribute pending items to shortest columns
    const newAssignments = createBalancedColumns(
      pendingItems,
      columns,
      (item) => measuredHeights.current.get(item) ?? 0,
      currentColumnHeights
    );

    for (let colIdx = 0; colIdx < newAssignments.length; colIdx++) {
      const col = newAssignments[colIdx];
      if (col) {
        for (const item of col) {
          columnAssignments.current.set(item, colIdx);
        }
      }
    }

    setPlacementGeneration((g) => g + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, columns, pendingItems.length]);

  // Re-measure placed items to keep heights up-to-date (for future placements)
  const placedMeasureRef = useCallback(
    (node: HTMLDivElement | null, item: T) => {
      if (node) {
        const height = node.getBoundingClientRect().height;
        measuredHeights.current.set(item, height);
      }
    },
    []
  );

  return (
    <Component {...rest} style={styles} data-generation={placementGeneration}>
      {placedColumns.map((column, columnIdx) => (
        <MasonryRow gap={gap} key={columnIdx}>
          {column.map((item, idx) => (
            <div key={idx} ref={(node) => placedMeasureRef(node, item)}>
              {render(item)}
            </div>
          ))}
        </MasonryRow>
      ))}
      {/* Hidden measurement area for pending items */}
      {pendingItems.length > 0 && (
        <div
          style={{
            visibility: "hidden",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            pointerEvents: "none",
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridColumnGap: gap,
          }}
        >
          {/* Render one pending item per column slot to get correct width */}
          {pendingItems.map((item, idx) => (
            <div
              key={idx}
              style={{ gridColumn: (idx % columns) + 1 }}
              ref={(node) => pendingMeasureRef(node, item)}
            >
              {render(item)}
            </div>
          ))}
        </div>
      )}
    </Component>
  );
}

export function MasonryRow({
  children,
  gap,
}: {
  children: React.ReactNode;
  gap: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        rowGap: gap,
        gridTemplateColumns: "minmax(0, 1fr)",
      }}
    >
      {children}
    </div>
  );
}

export function createChunks<T>(data: T[] = [], columns = 3) {
  const result = [];

  for (let idx = 0; idx < data.length; idx += columns) {
    const slice = data.slice(idx, idx + columns);
    result.push(slice);
  }

  return result;
}

export function createDataColumns<T>(data: T[][] = [], columns = 3) {
  const result = Array.from<T[], T[]>({ length: columns }, () => []);

  for (let idx = 0; idx < columns; idx++) {
    for (let jdx = 0; jdx < data.length; jdx += 1) {
      const item = data[jdx]?.[idx];
      if (item) {
        result[idx]?.push(item);
      }
    }
  }

  return result;
}

export function createBalancedColumns<T>(
  items: T[],
  columns: number,
  getHeight: (item: T) => number,
  initialColumnHeights?: number[]
): T[][] {
  const result = Array.from<T[], T[]>({ length: columns }, () => []);
  const columnHeights = initialColumnHeights
    ? [...initialColumnHeights]
    : new Array(columns).fill(0);

  // Maintain original order, but distribute to shortest column
  for (const item of items) {
    let shortestColumnIndex = 0;
    let minHeight = columnHeights[0];

    for (let i = 1; i < columns; i++) {
      if (columnHeights[i] < minHeight) {
        minHeight = columnHeights[i];
        shortestColumnIndex = i;
      }
    }

    result[shortestColumnIndex]?.push(item);
    columnHeights[shortestColumnIndex] += getHeight(item);
  }

  return result;
}

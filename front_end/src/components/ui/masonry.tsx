import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";

let masonryItemKeyCounter = 0;
const objectMasonryItemKeys = new WeakMap<object, number>();
const primitiveMasonryItemKeys = new Map<unknown, number>();

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
  const measuredHeights = useRef<Map<T, number>>(new Map());
  const [columnState, setColumnState] = useState<{
    columns: number;
    assignments: Map<T, number>;
  }>(() => ({ columns, assignments: new Map() }));
  const itemNodes = useRef<Map<T, HTMLElement>>(new Map());
  const nodeItems = useRef<Map<Element, T>>(new Map());
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const measuredColumnCount = useRef(columns);

  const resetMeasurementsForColumns = useCallback(() => {
    if (measuredColumnCount.current === columns) {
      return;
    }

    measuredColumnCount.current = columns;
    measuredHeights.current.clear();
  }, [columns]);

  const recordMeasuredHeight = useCallback((item: T, node: Element) => {
    const height = node.getBoundingClientRect().height;
    const previousHeight = measuredHeights.current.get(item);

    if (
      previousHeight !== undefined &&
      Math.abs(previousHeight - height) < 0.5
    ) {
      return;
    }

    measuredHeights.current.set(item, height);
  }, []);

  const getResizeObserver = useCallback(() => {
    if (typeof ResizeObserver === "undefined") {
      return null;
    }

    if (!resizeObserver.current) {
      resizeObserver.current = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const item = nodeItems.current.get(entry.target);
          if (item !== undefined) {
            recordMeasuredHeight(item, entry.target);
          }
        }
      });
    }

    return resizeObserver.current;
  }, [recordMeasuredHeight]);

  const measureItemRef = useCallback(
    (node: HTMLDivElement | null, item: T) => {
      const previousNode = itemNodes.current.get(item);
      const observer = getResizeObserver();

      if (previousNode && previousNode !== node) {
        observer?.unobserve(previousNode);
        nodeItems.current.delete(previousNode);
        itemNodes.current.delete(item);
      }

      if (!node) {
        return;
      }

      resetMeasurementsForColumns();
      itemNodes.current.set(item, node);
      nodeItems.current.set(node, item);
      observer?.observe(node);
      recordMeasuredHeight(item, node);
    },
    [getResizeObserver, recordMeasuredHeight, resetMeasurementsForColumns]
  );

  useEffect(() => {
    const currentItemNodes = itemNodes.current;
    const currentNodeItems = nodeItems.current;

    return () => {
      resizeObserver.current?.disconnect();
      resizeObserver.current = null;
      currentItemNodes.clear();
      currentNodeItems.clear();
    };
  }, []);

  useEffect(() => {
    const itemSet = new Set(items);

    for (const key of measuredHeights.current.keys()) {
      if (!itemSet.has(key)) {
        measuredHeights.current.delete(key);
      }
    }

    setColumnState((prev) => {
      let nextAssignments: Map<T, number> | null = null;

      for (const key of prev.assignments.keys()) {
        if (!itemSet.has(key)) {
          nextAssignments ??= new Map(prev.assignments);
          nextAssignments.delete(key);
        }
      }

      return nextAssignments
        ? { columns: prev.columns, assignments: nextAssignments }
        : prev;
    });

    for (const [item, node] of itemNodes.current) {
      if (!itemSet.has(item)) {
        resizeObserver.current?.unobserve(node);
        nodeItems.current.delete(node);
        itemNodes.current.delete(item);
      }
    }
  }, [items]);

  const placedColumns = useMemo(() => {
    if (columnState.columns !== columns) {
      return Array.from<T[], T[]>({ length: columns }, () => []);
    }

    return createColumnsFromAssignments(
      items,
      columns,
      columnState.assignments
    );
  }, [items, columns, columnState]);

  const pendingItems = useMemo(() => {
    if (columnState.columns !== columns) {
      return items;
    }

    const pending: T[] = [];
    for (const item of items) {
      if (!columnState.assignments.has(item)) {
        pending.push(item);
      }
    }

    return pending;
  }, [items, columns, columnState]);

  const displayedColumns = useMemo(() => {
    if (pendingItems.length === 0) {
      return placedColumns;
    }

    const columnsWithPending = placedColumns.map((column) => [...column]);
    pendingItems.forEach((item, index) => {
      columnsWithPending[index % columns]?.push(item);
    });

    return columnsWithPending;
  }, [placedColumns, pendingItems, columns]);

  useEffect(() => {
    if (pendingItems.length === 0) {
      return;
    }

    setColumnState((prev) => {
      const itemSet = new Set(items);
      const nextAssignments =
        prev.columns === columns ? new Map(prev.assignments) : new Map();

      for (const key of nextAssignments.keys()) {
        if (!itemSet.has(key)) {
          nextAssignments.delete(key);
        }
      }

      const stillPending: T[] = [];
      for (const item of items) {
        if (!nextAssignments.has(item)) {
          stillPending.push(item);
        }
      }

      if (stillPending.length === 0) {
        return prev.columns === columns
          ? prev
          : { columns, assignments: nextAssignments };
      }

      const estimatedHeight = getEstimatedHeight(
        items,
        measuredHeights.current
      );
      const currentColumns = createColumnsFromAssignments(
        items,
        columns,
        nextAssignments
      );
      const currentColumnHeights = currentColumns.map((column) =>
        getColumnHeight(
          column,
          (item) => measuredHeights.current.get(item) ?? estimatedHeight,
          gap
        )
      );
      const currentColumnCounts = currentColumns.map((column) => column.length);
      const newColumns = createBalancedColumns(
        stillPending,
        columns,
        (item) => measuredHeights.current.get(item) ?? estimatedHeight,
        currentColumnHeights,
        gap,
        currentColumnCounts
      );

      for (let columnIdx = 0; columnIdx < newColumns.length; columnIdx++) {
        for (const item of newColumns[columnIdx] ?? []) {
          nextAssignments.set(item, columnIdx);
        }
      }

      return { columns, assignments: nextAssignments };
    });
  }, [items, columns, gap, pendingItems.length]);

  return (
    <Component {...rest} style={styles}>
      {displayedColumns.map((column, columnIdx) => (
        <MasonryRow gap={gap} key={columnIdx}>
          {column.map((item) => (
            <div
              key={getMasonryItemKey(item)}
              ref={(node) => measureItemRef(node, item)}
            >
              {render(item)}
            </div>
          ))}
        </MasonryRow>
      ))}
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

function getMasonryItemKey<T>(item: T) {
  const itemType = typeof item;

  if (item !== null && (itemType === "object" || itemType === "function")) {
    const objectItem = item as object;
    let key = objectMasonryItemKeys.get(objectItem);

    if (key === undefined) {
      key = masonryItemKeyCounter;
      masonryItemKeyCounter += 1;
      objectMasonryItemKeys.set(objectItem, key);
    }

    return key;
  }

  let key = primitiveMasonryItemKeys.get(item);

  if (key === undefined) {
    key = masonryItemKeyCounter;
    masonryItemKeyCounter += 1;
    primitiveMasonryItemKeys.set(item, key);
  }

  return key;
}

function createColumnsFromAssignments<T>(
  items: T[],
  columns: number,
  assignments: Map<T, number>
) {
  const result = Array.from<T[], T[]>({ length: columns }, () => []);

  for (const item of items) {
    const columnIdx = assignments.get(item);

    if (columnIdx !== undefined && result[columnIdx]) {
      result[columnIdx].push(item);
    }
  }

  return result;
}

function getEstimatedHeight<T>(items: T[], measuredHeights: Map<T, number>) {
  let totalHeight = 0;
  let measuredCount = 0;

  for (const item of items) {
    const height = measuredHeights.get(item);

    if (height !== undefined) {
      totalHeight += height;
      measuredCount += 1;
    }
  }

  return measuredCount ? totalHeight / measuredCount : 1;
}

function getColumnHeight<T>(
  items: T[],
  getHeight: (item: T) => number,
  gap: number
) {
  let totalHeight = 0;

  for (let idx = 0; idx < items.length; idx++) {
    totalHeight += getHeight(items[idx] as T);

    if (idx > 0) {
      totalHeight += gap;
    }
  }

  return totalHeight;
}

export function createBalancedColumns<T>(
  items: T[],
  columns: number,
  getHeight: (item: T) => number,
  initialColumnHeights?: number[],
  gap = 0,
  initialColumnCounts?: number[]
): T[][] {
  const result = Array.from<T[], T[]>({ length: columns }, () => []);
  const columnHeights = initialColumnHeights
    ? [...initialColumnHeights]
    : new Array(columns).fill(0);
  const columnCounts = initialColumnCounts
    ? [...initialColumnCounts]
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
    columnHeights[shortestColumnIndex] +=
      getHeight(item) + (columnCounts[shortestColumnIndex] ? gap : 0);
    columnCounts[shortestColumnIndex] += 1;
  }

  return result;
}

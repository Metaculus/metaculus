declare module "react-simple-maps" {
  import * as React from "react";

  export interface ComposableMapProps extends React.SVGProps<SVGSVGElement> {
    projection?:
      | string
      | ((opts: { width: number; height: number }) => unknown);
    projectionConfig?: Record<string, unknown>;
    width?: number;
    height?: number;
    children?: React.ReactNode;
  }
  export const ComposableMap: React.FC<ComposableMapProps>;

  export interface GeographyType {
    rsmKey: string;
    id?: string | number;
    type?: string;
    properties?: Record<string, unknown>;
    geometry?: unknown;
  }

  export interface GeographiesProps {
    geography: string | object;
    parseGeographies?: (geos: GeographyType[]) => GeographyType[];
    children: (props: {
      geographies: GeographyType[];
      projection: unknown;
      path: unknown;
    }) => React.ReactNode;
  }
  export const Geographies: React.FC<GeographiesProps>;

  export interface GeographyProps
    extends Omit<React.SVGProps<SVGPathElement>, "style"> {
    geography: GeographyType;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    onMouseEnter?: (e: React.MouseEvent<SVGPathElement>) => void;
    onMouseLeave?: (e: React.MouseEvent<SVGPathElement>) => void;
    onClick?: (e: React.MouseEvent<SVGPathElement>) => void;
  }
  export const Geography: React.FC<GeographyProps>;

  export interface MarkerProps extends React.SVGProps<SVGGElement> {
    coordinates: [number, number];
    children?: React.ReactNode;
  }
  export const Marker: React.FC<MarkerProps>;
}

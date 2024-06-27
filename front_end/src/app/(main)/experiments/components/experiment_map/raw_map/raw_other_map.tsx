import * as d3 from "d3";
import {
  forwardRef,
  SVGProps,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

import stateData from "./data/us_states.json";

const CustomRawUsMap = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  (props, ref) => {
    const didInitialize = useRef(false);
    const svgRef = useRef<SVGSVGElement>(null);
    useImperativeHandle(ref, () => svgRef.current as SVGSVGElement);

    useEffect(() => {
      const svgElement = svgRef.current;
      if (!svgElement || didInitialize.current) return;
      didInitialize.current = true;

      const svg = d3.select(svgElement);

      const { width, height } = svgElement.getBoundingClientRect();

      svg.append("rect");
      const projection = d3
        .geoAlbersUsa()
        .translate([width / 2, height / 2])
        .scale(width);

      const pathGenerator = d3.geoPath().projection(projection);

      svg
        .append("g")
        .attr("id", "Areas")
        .selectAll("path")
        .data(stateData.features)
        .enter()
        .append("path")
        .attr("id", (feature) => feature.properties.NAME)
        .attr("d", (feature) => pathGenerator(feature as any))
        .attr("fill", "#D3D3D3");
    }, []);

    return (
      <svg
        viewBox="0 0 959 593"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        ref={svgRef}
        {...props}
      />
    );
  }
);
CustomRawUsMap.displayName = "CustomRawUsMap";

export default CustomRawUsMap;

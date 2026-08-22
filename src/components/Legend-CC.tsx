import {
  LegendThreshold,
  LegendOrdinal,
  LegendLabel,
  LegendItem,
} from "@visx/legend";
import { scaleOrdinal, scaleThreshold } from "@visx/scale";

interface LegendProps {
  title: string;
  items: Array<{
    color: string;
    text: string;
  }>;
}

const LegendCC: React.FC<LegendProps> = ({ items, title }) => {
  const ordinalColorScale = scaleOrdinal({
    domain: items.map((item) => item.text),
    range: items.map((item) => item.color),
  });

  return (
    <LegendOrdinal scale={ordinalColorScale}>
      {(labels) => (
        <div className="LegendCC">
          <p>{title}</p>

          {labels.map((label, i) => (
            <LegendItem
              key={`legend-quantile-${i}`}
              margin="0px 5px"
              onClick={() => {
                // if (events) alert(`clicked: ${JSON.stringify(label)}`);
              }}
            >
              <LegendLabel align="left" margin="0 0 0 4px">
                {label.text}
              </LegendLabel>
              <svg width={10} height={10} style={{ marginLeft: "7px" }}>
                <rect fill={label.value} width={10} height={10} />
              </svg>
            </LegendItem>
          ))}
        </div>
      )}
    </LegendOrdinal>
  );
};

export default LegendCC;

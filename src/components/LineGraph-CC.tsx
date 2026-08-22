import React, { useMemo } from "react";
import { LineSeries, ResponsiveLine } from "@nivo/line";
import { ModifyDateFromLocalToUsStandard } from "@/scripts/Generator";
import { motion } from "motion/react";
import { LabBaseParameters } from "@/scripts/Constants";

interface LineGraphProps {
  theme: colorSchemas;
  title: string;
  subtitle: string;
  data: Array<FormatedLabSomaParams>;
  onPointClick: (props: PointProps) => void;
}

const spring = {
  type: "spring",
  damping: 30,
  stiffness: 200,
};

const LineGraphCC: React.FC<LineGraphProps> = ({
  data,
  theme,
  title,
  subtitle,
  onPointClick,
}) => {
  // const { ref, inView } = useInView({
  //   threshold: 0.1, // How much of it needs to be visible
  // });
  const LineColor = theme === "day" ? "#00391b" : "#bbf3d8";
  const Theme = {
    background: theme === "day" ? "#e6e6e6" : "#141414",
    crosshair: {
      line: {
        stroke: theme === "night" ? "#e6e6e6" : "#141414",
        strokeOpacity: 1,
        strokeWidth: 1,
      },
    },
    text: {
      fontSize: 11,
      fill: theme === "day" ? "#333333" : "#ffffff",
      outlineWidth: 0,
      outlineColor: "#ffffff",
    },
    axis: {
      domain: {
        line: {
          stroke: theme === "day" ? "#dddddd" : "#333333",
          strokeWidth: 1,
        },
      },
      legend: {
        text: {
          fontSize: 12,
          fill: "transparent",
          outlineWidth: 0,
          outlineColor: "#ffffff",
        },
      },
      ticks: {
        line: {
          stroke: theme === "night" ? "#e6e6e6" : "#141414",
          strokeWidth: 1,
        },
        text: {
          fontSize: 11,
          fill: theme === "day" ? "#333333" : "#dddddd",
          outlineWidth: 0,
          outlineColor: "#ffffff",
        },
      },
    },
    grid: {
      line: {
        stroke: theme === "day" ? "#cccccc" : "#303030",
        strokeWidth: 1,
      },
    },
    legends: {
      title: {
        text: {
          fontSize: 11,
          fill: "#333333",
          outlineWidth: 0,
          outlineColor: "#ffffff",
        },
      },
      text: {
        fontSize: 11,
        fill: "rgb(104, 193, 178)",
        outlineWidth: 0,
        outlineColor: "#ffffff",
      },
      ticks: {
        line: {},
        text: {
          fontSize: 10,
          fill: "#333333",
          outlineWidth: 0,
          outlineColor: "#ffffff",
        },
      },
    },
    annotations: {
      text: {
        fontSize: 13,
        fill: "#333333",
        outlineWidth: 2,
        outlineColor: "#ffffff",
        outlineOpacity: 1,
      },
      link: {
        stroke: "#000000",
        strokeWidth: 1,
        outlineWidth: 2,
        outlineColor: "#ffffff",
        outlineOpacity: 1,
      },
      outline: {
        stroke: "#000000",
        strokeWidth: 2,
        outlineWidth: 2,
        outlineColor: "#ffffff",
        outlineOpacity: 1,
      },
      symbol: {
        fill: "#000000",
        outlineWidth: 2,
        outlineColor: "#ffffff",
        outlineOpacity: 1,
      },
    },
    tooltip: {
      container: {
        background: theme === "day" ? "#141414" : "#e6e6e6",
        color: theme === "night" ? "#141414" : "#e6e6e6",
        fontSize: 12,
      },
      basic: {},
      chip: {},
      table: {},
      tableCell: {},
      tableCellValue: {},
    },
  };

  const OptData = useMemo((): LineSeries[] | undefined => {
    const InRangeObject: {
      id: string;
      data: { x: string; y: number | null }[];
    } = { id: `InRangeObject-${title}`, data: [] };
    const OutOfRangeObject: {
      id: string;
      data: { x: string; y: number | null }[];
    } = { id: `OutOfRangeObject-${title}`, data: [] };

    data.map((lab, index) => {
      const formatedDate = ModifyDateFromLocalToUsStandard(lab.dateTaken);
      const commaToDotValue = lab.value.replace(",", ".");
      const parsedValue = parseFloat(commaToDotValue);

      if (
        LabBaseParameters[title] &&
        parsedValue <= LabBaseParameters[title].topRange &&
        parsedValue >= LabBaseParameters[title].bottomRange
      ) {
        InRangeObject.data.push({
          x: formatedDate,
          y: parsedValue,
        });

        OutOfRangeObject.data.push({
          x: formatedDate,
          y: null,
        });

        if (index !== 0) {
          InRangeObject.data[index - 1] = {
            x: ModifyDateFromLocalToUsStandard(data[index - 1].dateTaken),
            y: parseFloat(data[index - 1].value),
          };
        }
      } else {
        OutOfRangeObject.data.push({
          x: formatedDate,
          y: parsedValue,
        });

        if (index !== 0) {
          OutOfRangeObject.data[index - 1] = {
            x: ModifyDateFromLocalToUsStandard(data[index - 1].dateTaken),
            y: parseFloat(data[index - 1].value),
          };
        }
      }
    });
    OutOfRangeObject.data.sort(
      (datA, datB) => new Date(datA.x).getTime() - new Date(datB.x).getTime(),
    );

    return [InRangeObject, OutOfRangeObject];

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const HighestAndLowestValue = useMemo((): [number, number] => {
    const values = data.map((lab) => parseInt(lab.value));
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);

    return [minValue, maxValue];

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const HandLSmallChange = useMemo((): [number, number] => {
    const maxValue = Math.ceil(
      HighestAndLowestValue[1] + HighestAndLowestValue[1] / 10,
    );
    const minValue = Math.floor(
      HighestAndLowestValue[0] - HighestAndLowestValue[0] / 10,
    );

    return [minValue, maxValue];

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [HighestAndLowestValue]);

  return (
    <motion.div className="LineGraphCC" layout transition={spring}>
      {OptData ? (
        <>
          <div className="topCont">
            <h3>
              {LabBaseParameters[title]
                ? `${LabBaseParameters[title].name} (${title})`
                : `${title} (${subtitle})`}
            </h3>
            {/* <ButtonCC
              classname="TopAddLabButton"
              type={"Slim"}
              style={"Blue"}
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
                    clipRule="evenodd"
                  />
                </svg>
              }
            /> */}
          </div>
          <div className="lineCont">
            <ResponsiveLine
              animate
              crosshairType="x"
              axisBottom={{
                format: "%b %d",
                legend: "time scale",
                legendOffset: 0,
                tickValues: "every 30 days",
              }}
              axisLeft={{
                legend: "linear scale",
                legendOffset: 12,
              }}
              curve="monotoneX"
              data={OptData}
              enableTouchCrosshair
              initialHiddenIds={["cognac"]}
              margin={{
                bottom: 100,
                left: 80,
                right: 80,
                top: 50,
              }}
              // pointBorderColor={{
              //   from: "color",
              //   modifiers: [["darker", 0.2]],
              // }}
              // pointBorderWidth={2}
              // pointSize={6}

              pointBorderColor={{
                from: "color",
                modifiers: [["opacity", 0.5]],
              }}
              pointColor={LineColor}
              pointBorderWidth={5}
              pointSize={10}
              // pointSymbol={() => {}}

              enableArea
              areaBaselineValue={
                LabBaseParameters[title]
                  ? (LabBaseParameters[title].topRange +
                      LabBaseParameters[title].bottomRange) /
                    2
                  : HighestAndLowestValue[0]
              }
              isInteractive
              onClick={(e) => {
                onPointClick({
                  Abbr: title,
                  Name: subtitle,
                  // @ts-ignore
                  xValue: e.data.xFormatted,
                  // @ts-ignore
                  yValue: e.data.y,
                });
              }}
              markers={
                LabBaseParameters[title]
                  ? [
                      {
                        axis: "y",
                        legend: "Max",
                        legendPosition: "bottom-left",
                        lineStyle: {
                          stroke:
                            theme === "day"
                              ? "rgb(186, 170, 26)"
                              : "rgb(238, 234, 161)",
                          strokeWidth: theme === "day" ? 3 : 1,
                        },
                        textStyle: {
                          fontSize: "0.7rem",
                          fill:
                            theme === "day"
                              ? "rgb(186, 170, 26)"
                              : "rgb(238, 234, 161)",
                        },
                        value: LabBaseParameters[title].topRange,
                      },
                      {
                        axis: "y",
                        legend: "Min",
                        legendPosition: "bottom-left",
                        lineStyle: {
                          stroke:
                            theme === "day"
                              ? "rgb(186, 170, 26)"
                              : "rgb(238, 234, 161)",
                          strokeWidth: theme === "day" ? 3 : 1,
                        },
                        textStyle: {
                          fontSize: "0.7rem",
                          fill:
                            theme === "day"
                              ? "rgb(186, 170, 26)"
                              : "rgb(238, 234, 161)",
                        },
                        value: LabBaseParameters[title].bottomRange,
                      },
                    ]
                  : undefined
              }
              colors={
                LabBaseParameters[title]
                  ? ["rgb(104, 193, 178)", "rgb(244, 117, 96)"]
                  : LineColor
              }
              useMesh
              xFormat="time:%Y-%m-%d"
              xScale={{
                format: "%Y-%m-%d",
                precision: "day",
                type: "time",
                useUTC: false,
              }}
              yScale={
                LabBaseParameters[title]
                  ? {
                      max:
                        HighestAndLowestValue[1] >
                          LabBaseParameters[title].topRange ||
                        LabBaseParameters[title] === undefined
                          ? HighestAndLowestValue[1] +
                            HighestAndLowestValue[1] / 5
                          : LabBaseParameters[title].topRange +
                            LabBaseParameters[title].topRange / 9,
                      min:
                        HighestAndLowestValue[0] <
                        LabBaseParameters[title].bottomRange
                          ? HighestAndLowestValue[0] -
                            HighestAndLowestValue[0] / 5
                          : LabBaseParameters[title].bottomRange -
                            LabBaseParameters[title].bottomRange / 9,
                      stacked: false,
                      type: "linear",
                    }
                  : {
                      max: HandLSmallChange[1],
                      min: HandLSmallChange[0],
                      stacked: false,
                      type: "linear",
                    }
              }
              theme={Theme}
            />
          </div>
        </>
      ) : null}
    </motion.div>
  );
};

export default LineGraphCC;

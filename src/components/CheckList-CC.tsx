import React, { useEffect, useState } from "react";
import InputCC from "./Input-CC";

interface CheckListCCProps {
  title: string;
  items: string[];
  allChecked?: boolean;
  toggle?: boolean;
  onChange?: (item: string) => void;
  colorSchema?: colorSchemas;
}

const CheckListCC: React.FC<CheckListCCProps> = ({
  items,
  title,
  toggle,
  onChange,
  allChecked,
  colorSchema,
}) => {
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof toggle === "boolean") {
      setDrawerOpen(toggle);
    }
  }, [toggle]);

  return (
    <div
      className={`CheckListCC CheckList-${colorSchema}`}
      id={drawerOpen ? "OpenCheckList" : "ClosedCheckList"}
    >
      <h3 onClick={() => setDrawerOpen(!drawerOpen)}>{title}</h3>
      <ul className="CheckListContainer">
        {items.length === 0 ? (
          <li className="NoItemsInfo">{"No hay elementos para mostrar."}</li>
        ) : (
          items.map((item, index) => (
            <li className="CheckListItem" key={index}>
              <InputCC
                type={"checkbox"}
                colorSchema={colorSchema}
                label={item}
                initialValue={allChecked ? "checked" : undefined}
                identifier={"CheckListCC"}
                onChange={(e) => {
                  onChange && onChange(`${item} ~ ${e}`);
                }}
              />
            </li>
          ))
        )}
      </ul>
      <div className="ArrowContainer" id={drawerOpen ? "UpArrow" : "DownArrow"}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-6"
        >
          <path
            fillRule="evenodd"
            d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
};

export default CheckListCC;

import React, { useState } from "react";

interface DropdownItem {
  text: string;
  icon: React.ReactElement;
  action: () => void;
}

interface DropdownProps {
  itemsList: Array<DropdownItem | null>;
  style: "Blue" | "White";
  classname: string;
}

const DropdownCC: React.FC<DropdownProps> = ({
  itemsList,
  style,
  classname,
}) => {
  const [dropdownState, setDropdownState] = useState<"open" | "closed">(
    "closed"
  );

  return (
    <div
      id="DropdownCC"
      className={`DropdownCC${style} ${classname} Dropdown${dropdownState} `}
      onClick={() => {
        setDropdownState(dropdownState === "open" ? "closed" : "open");
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="dotsIcon"
      >
        <path
          fillRule="evenodd"
          d="M4.5 12a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z"
          clipRule="evenodd"
        />
      </svg>

      <div className={`itemsContainer`}>
        {itemsList.map((item) => {
          if (item)
            return (
              <div
                className="dropdownItem"
                key={item.text}
                onClick={() => item.action()}
              >
                {item.icon}
                <p>{item.text}</p>
              </div>
            );
        })}
      </div>
    </div>
  );
};

export default DropdownCC;

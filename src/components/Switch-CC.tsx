"use client";

import React, { useEffect, useState } from "react";

interface SwitchCCProps {
  onSwitch?: (data: boolean) => void;
  customStates?: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
}

const SwitchCC: React.FC<SwitchCCProps> = ({ onSwitch, customStates }) => {
  const [switchState, setSwitchState] = useState<boolean>(false);

  useEffect(() => {
    onSwitch && onSwitch(switchState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [switchState]);

  useEffect(() => {
    if (customStates) {
      setSwitchState(customStates[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customStates?.[0]]);

  const toggle = () => {
    if (customStates) {
      customStates[1](!customStates[0]);
    } else {
      setSwitchState((s) => !s);
    }
  };

  return (
    <div
      className={`ButtonCC-Switch ButtonCC-Switch-${switchState}`}
      onClick={toggle}
    >
      <div
        className="ball"
        style={{
          transform: switchState
            ? "translateX(100%) rotate(0deg)"
            : "translateX(0%) rotate(-360deg)",
          backgroundColor: switchState ? "black" : "white",
        }}
      >
        <div className="nightSvg" style={{ opacity: switchState ? 0 : 1 }} />
        <div className="daySvg" style={{ opacity: !switchState ? 0 : 1 }} />
      </div>
    </div>
  );
};

export default SwitchCC;

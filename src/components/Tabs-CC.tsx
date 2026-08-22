import React, { useEffect } from "react";

interface Tabs {
  title: string;
  icon: React.ReactElement;
  identifier: string;
}

interface TabsCCProps {
  tabsList: Array<Tabs>;
  setTab?: () => string;
  onTabChange: (tab: string) => void;
}

const TabsCC: React.FC<TabsCCProps> = ({ tabsList, setTab, onTabChange }) => {
  const [activeTab, setActiveTab] = React.useState(tabsList[0].identifier);

  useEffect(() => {
    if (setTab) {
      setActiveTab(setTab());
    }
  }, [setTab]);

  useEffect(() => {
    if (onTabChange) {
      onTabChange(activeTab);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="TabsCC">
      {tabsList.map((tab) => (
        <div
          key={tab.identifier}
          className={`TabCC ${activeTab === tab.identifier ? "activeCC" : ""}`}
          onClick={() => setActiveTab(tab.identifier)}
        >
          <p>{tab.title}</p>
        </div>
      ))}
    </div>
  );
};

export default TabsCC;

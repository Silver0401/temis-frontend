"use client";

import React from "react";
import DisintegrateImage from "@/components/DisintegrateImage";
import Bg from "@/assets/Images/GreenAbstract.jpg";

const NewsSection: React.FC = () => {
  return (
    <div className="NewsSection" id="overlap2">
      <DisintegrateImage src={Bg.src} className="bgImgContainer" />
      <span className="square1" />
      <span className="square2" />
      <span className="square3" />
      <span className="square4" />
    </div>
  );
};

export default NewsSection;

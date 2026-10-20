import React from "react";

const JobNovaLogo = ({ className = "h-16 w-16" }) => {
  return (
    <img
      src="/images/jobnova-logo.png"
      alt="JobNova Logo"
      className={`${className} object-contain`}
    />
  );
};

export default JobNovaLogo;
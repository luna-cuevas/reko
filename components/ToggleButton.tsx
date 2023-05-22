import { useState } from "react";

interface ToggleButtonProps {
  setIsPublic: (status: boolean) => void;
  checked: boolean;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  setIsPublic,
  checked,
}) => {
  const handleToggle = (e: any) => {
    e.preventDefault();
    setIsPublic(!checked);
  };

  return (
    <button
      className={`bg-gray-300 w-11 h-5 rounded-full p-1 transition-colors ${
        checked ? "bg-green-400" : "bg-gray-500"
      }`}
      onClick={(e) => handleToggle(e)}>
      <span
        className={`block w-3 h-3 rounded-full transition-transform transform ${
          checked ? "translate-x-6" : "translate-x-0"
        } bg-white`}></span>
    </button>
  );
};

export default ToggleButton;

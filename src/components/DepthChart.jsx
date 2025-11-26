import React from "react";

const DepthChart = () => {
  return (
    <div
      style={{
        background: "#111",
        padding: 15,
        borderRadius: 10,
        marginBottom: 25,
      }}
    >
      <h3>Depth Chart</h3>
      <div
        style={{
          height: 180,
          marginTop: 10,
          background: "linear-gradient(to right, #0f0, #f00)",
          borderRadius: 10,
        }}
      />
    </div>
  );
};

export default DepthChart;

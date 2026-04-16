import React, { useState } from "react";
import T from "../theme";

export default function Guide({ title, steps, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={T.guide}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={T.guideTitle}>{title}</div>
        <button style={T.guideToggle} onClick={() => setOpen(!open)}>{open ? "Masquer" : "Guide"}</button>
      </div>
      {open && (
        <div style={{ marginTop: "0.5rem" }}>
          {steps.map((step, i) => (
            <div key={i} style={T.guideStep}>
              <div style={T.guideNumber}>{i + 1}</div>
              <div>{step}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

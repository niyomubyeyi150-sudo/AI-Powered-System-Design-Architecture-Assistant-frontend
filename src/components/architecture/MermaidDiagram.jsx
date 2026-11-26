import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

import { generateMermaid } from "../../utils/generateMermaid";

// Configure Mermaid once.
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "strict",
  flowchart: {
    curve: "basis",
    htmlLabels: false,
  },
});

function MermaidDiagram({ nodes, edges }) {
  const diagramRef = useRef(null);
  const renderId = useRef(0);

  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function renderDiagram() {
      const diagram = generateMermaid(nodes, edges);

      try {
        const currentId = `archpilot-diagram-${++renderId.current}`;

        const { svg } = await mermaid.render(currentId, diagram);

        if (!isActive || !diagramRef.current) return;

        diagramRef.current.innerHTML = svg;
        setError("");
      } catch (err) {
        console.error("Unable to render Mermaid diagram:", err);

        if (isActive) {
          setError("Unable to display the architecture diagram.");
        }
      }
    }

    renderDiagram();

    return () => {
      isActive = false;
    };
  }, [nodes, edges]);

  return (
    <section className="mermaid-diagram-panel">
      <div className="mermaid-diagram-header">
        <div>
          <span className="section-eyebrow">VISUALIZATION</span>
          <h2>Architecture Diagram</h2>
          <p>Automatically generated from your architecture canvas.</p>
        </div>

        <span className="canvas-status">
          <span className="canvas-status-dot"></span>
          Live Preview
        </span>
      </div>

      {error ? (
        <p role="alert" className="mermaid-error">
          {error}
        </p>
      ) : (
        <div
          className="mermaid-diagram-content"
          ref={diagramRef}
          aria-label="Generated architecture diagram"
        />
      )}
    </section>
  );
}

export default MermaidDiagram;

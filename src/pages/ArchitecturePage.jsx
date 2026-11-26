import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { MarkerType, useNodesState, useEdgesState } from "@xyflow/react";
import ArchitectureCanvas from "../components/architecture/ArchitectureCanvas";
import {
  getArchitecture,
  saveArchitecture,
} from "../services/architectureService";
import MermaidDiagram from "../components/architecture/MermaidDiagram";


const componentGroups = [
  {
    title: "Client / Frontend",
    items: ["Web Client", "Mobile Client"],
  },
  {
    title: "Backend Services",
    items: ["Monolith", "Microservice", "API Gateway", "Worker"],
  },
  {
    title: "Data Stores",
    items: ["Relational Database", "NoSQL Database", "Cache", "Object Storage"],
  },
  {
    title: "External Integrations",
    items: ["Third-party API", "Auth Provider", "Message Broker"],
  },
];

// ========================================
// ARCHITECTURE NODE STYLE
// ========================================

const nodeStyle = {
  background: "var(--surface-secondary)",
  color: "var(--text)",
  border: "1px solid var(--accent)",
  borderRadius: "10px",
  padding: "14px",
  width: 180,
  fontWeight: 600,
};

// ========================================
// VALIDATION SETTINGS
// ========================================

const MAX_NODE_LABEL_LENGTH = 60;
const MAX_EDGE_DESCRIPTION_LENGTH = 300;
const MAX_NODES = 100;
const MAX_EDGES = 200;

const allowedCategories = componentGroups.map((group) => group.title);

const allowedProtocols = ["REST", "GraphQL", "gRPC", "Async Events"];

const allowedInteractions = ["Read", "Write", "Read / Write", "Event"];

// ========================================
// HELPER FUNCTIONS
// ========================================

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function sanitizeText(value, maxLength) {
  return Array.from(String(value ?? ""))
    .filter((char) => {
      const code = char.codePointAt(0);
      return code > 31 && code !== 127;
    })
    .join("")
    .slice(0, maxLength);
}

function isValidPosition(position) {
  return position && Number.isFinite(position.x) && Number.isFinite(position.y);
}

function validateArchitecture(nodes, edges) {
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return "Invalid architecture data.";
  }

  if (nodes.length > MAX_NODES) {
    return `Your architecture cannot contain more than ${MAX_NODES} components.`;
  }

  if (edges.length > MAX_EDGES) {
    return `Your architecture cannot contain more than ${MAX_EDGES} connections.`;
  }

  const nodeIds = new Set();

  for (const node of nodes) {
    if (
      !node ||
      typeof node.id !== "string" ||
      !node.id.trim() ||
      nodeIds.has(node.id)
    ) {
      return "Every component must have a unique valid ID.";
    }

    nodeIds.add(node.id);

    const label = sanitizeText(node.data?.label, MAX_NODE_LABEL_LENGTH);

    if (!label.trim()) {
      return "Every component must have a name before saving.";
    }

    if (!allowedCategories.includes(node.data?.category)) {
      return `The category for component "${label}" is invalid.`;
    }

    if (!isValidPosition(node.position)) {
      return `The position of component "${label}" is invalid.`;
    }
  }

  const edgeIds = new Set();

  for (const edge of edges) {
    if (
      !edge ||
      typeof edge.id !== "string" ||
      !edge.id.trim() ||
      edgeIds.has(edge.id)
    ) {
      return "Every connection must have a unique valid ID.";
    }

    edgeIds.add(edge.id);

    if (
      typeof edge.source !== "string" ||
      typeof edge.target !== "string" ||
      !nodeIds.has(edge.source) ||
      !nodeIds.has(edge.target)
    ) {
      return "A connection refers to a component that does not exist.";
    }

    if (edge.source === edge.target) {
      return "A component cannot connect to itself.";
    }

    const protocol = edge.data?.protocol ?? "REST";
    const interaction = edge.data?.interaction ?? "Read / Write";

    if (!allowedProtocols.includes(protocol)) {
      return "A connection contains an invalid protocol.";
    }

    if (!allowedInteractions.includes(interaction)) {
      return "A connection contains an invalid interaction type.";
    }

    const description = edge.data?.description ?? "";

    if (
      typeof description !== "string" ||
      description.length > MAX_EDGE_DESCRIPTION_LENGTH
    ) {
      return "A connection description is too long or invalid.";
    }

    if (edge.label != null && typeof edge.label !== "string") {
      return "A connection label is invalid.";
    }
  }

  return "";
}

function getCategory(label) {
  if (["Web Client", "Mobile Client"].includes(label)) {
    return "Client / Frontend";
  }

  if (
    [
      "Relational Database",
      "NoSQL Database",
      "Cache",
      "Object Storage",
    ].includes(label)
  ) {
    return "Data Stores";
  }

  if (
    [
      "Third-party API",
      "Payment Provider",
      "Auth Provider",
      "Message Broker",
    ].includes(label)
  ) {
    return "External Integrations";
  }

  return "Backend Services";
}

// ========================================
// ARCHITECTURE PAGE
// ========================================

function ArchitecturePage() {
  const { projectId } = useParams();
  const location = useLocation();

  // Use development links only while inside /dev routes.
  const routePrefix = location.pathname.startsWith("/dev/") ? "/dev" : "";

  // ========================================
  // PROJECT STATE
  // ========================================

  const [project, setProject] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);

  // ========================================
  // REACT FLOW STATE
  // ========================================

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // ========================================
  // SELECTION STATE
  // ========================================

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState(null);

  // ========================================
  // FEEDBACK STATE
  // ========================================

  const [saveMessage, setSaveMessage] = useState("");

  // ========================================
  // LOAD PROJECT AND ARCHITECTURE
  // ========================================

  useEffect(() => {
    let isActive = true;

    async function loadProject() {
      setProjectLoading(true);
      setProject(null);
      setNodes([]);
      setEdges([]);
      setSaveMessage("");
      setSelectedNodeId(null);
      setSelectedEdgeId(null);

      try {
        const savedProjects = JSON.parse(
          localStorage.getItem("archpilot-projects") || "[]",
        );

        if (!Array.isArray(savedProjects)) {
          throw new Error("Invalid saved project data.");
        }

        const selectedProject = savedProjects.find(
          (item) => String(item.id) === String(projectId),
        );

        if (!isActive) return;

        if (!selectedProject) {
          setProject(null);
          return;
        }

        setProject(selectedProject);

        const architecture = getArchitecture(projectId);

        const savedNodes = Array.isArray(architecture?.nodes)
          ? architecture.nodes
          : [];

        const savedEdges = Array.isArray(architecture?.edges)
          ? architecture.edges
          : [];

        const validationError = validateArchitecture(savedNodes, savedEdges);

        if (validationError) {
          setSaveMessage(
            `Saved architecture could not be restored: ${validationError}`,
          );
          return;
        }

        setNodes(savedNodes);
        setEdges(savedEdges);
      } catch (error) {
        console.error("Unable to load project:", error);

        if (isActive) {
          setProject(null);
          setSaveMessage("Unable to load the project or its architecture.");
        }
      } finally {
        if (isActive) {
          setProjectLoading(false);
        }
      }
    }

    loadProject();

    return () => {
      isActive = false;
    };
  }, [projectId, setNodes, setEdges]);

  // ========================================
  // ADD COMPONENT
  // ========================================

  function addComponent(label, category) {
    if (nodes.length >= MAX_NODES) {
      setSaveMessage(`You can add a maximum of ${MAX_NODES} components.`);
      return;
    }

    if (!allowedCategories.includes(category)) {
      setSaveMessage("Invalid component category.");
      return;
    }

    const safeLabel = sanitizeText(label, MAX_NODE_LABEL_LENGTH);

    if (!safeLabel.trim()) {
      setSaveMessage("Component name cannot be empty.");
      return;
    }

    const index = nodes.length;

    const newNode = {
      id: createId("node"),
      type: "default",
      position: {
        x: 100 + (index % 3) * 220,
        y: 100 + Math.floor(index / 3) * 150,
      },
      data: {
        label: safeLabel,
        category,
      },
      style: { ...nodeStyle },
    };

    setNodes((currentNodes) => [...currentNodes, newNode]);

    setSelectedNodeId(newNode.id);
    setSelectedEdgeId(null);
    setSaveMessage("");
  }

  // ========================================
  // PALETTE DRAG AND DROP
  // ========================================

  function handlePaletteDragStart(event, label, category) {
    const validCategory = allowedCategories.includes(category);

    const safeLabel = sanitizeText(label, MAX_NODE_LABEL_LENGTH);

    const validItem = componentGroups.some(
      (group) => group.title === category && group.items.includes(safeLabel),
    );

    if (!validCategory || !validItem) {
      event.preventDefault();
      setSaveMessage("Invalid component.");
      return;
    }

    event.dataTransfer.setData(
      "application/archpilot",
      JSON.stringify({
        label: safeLabel,
        category,
      }),
    );

    event.dataTransfer.effectAllowed = "move";
  }

  // ========================================
  // CANVAS ERROR FEEDBACK
  // ========================================

  function handleCanvasError(message) {
    setSaveMessage(message);
  }

  // ========================================
  // GENERATE ARCHITECTURE
  // ========================================

  function generateArchitecture() {
    if (!project) return;

    const requirements = project.requirements || {};

    const requirementText = JSON.stringify(requirements).toLowerCase();

    const hasPayment = requirementText.includes("payment");

    const hasNotifications = requirementText.includes("notification");

    const hasHighTraffic =
      requirementText.includes("large") ||
      requirementText.includes("high") ||
      requirementText.includes("10000") ||
      requirementText.includes("10,000");

    const components = [
      { id: "web", label: "Web Client", x: 100, y: 50 },
      { id: "mobile", label: "Mobile Client", x: 450, y: 50 },
      { id: "gateway", label: "API Gateway", x: 275, y: 180 },
      { id: "auth", label: "Auth Service", x: 50, y: 340 },
      { id: "product", label: "Product Service", x: 275, y: 340 },
      { id: "order", label: "Order Service", x: 500, y: 340 },
      {
        id: "database",
        label: "Relational Database",
        x: 275,
        y: 550,
      },
    ];

    if (hasPayment) {
      components.push(
        {
          id: "payment",
          label: "Payment Service",
          x: 725,
          y: 340,
        },
        {
          id: "provider",
          label: "Payment Provider",
          x: 950,
          y: 340,
        },
      );
    }

    if (hasHighTraffic) {
      components.push({
        id: "cache",
        label: "Cache",
        x: 50,
        y: 550,
      });
    }

    if (hasNotifications) {
      components.push(
        {
          id: "broker",
          label: "Message Broker",
          x: 725,
          y: 550,
        },
        {
          id: "worker",
          label: "Notification Worker",
          x: 950,
          y: 550,
        },
      );
    }

    const generatedNodes = components.map((component) => ({
      id: component.id,
      type: "default",
      position: {
        x: component.x,
        y: component.y,
      },
      data: {
        label: component.label,
        category: getCategory(component.label),
      },
      style: { ...nodeStyle },
    }));

    function createEdge(
      id,
      source,
      target,
      label = "REST API",
      protocol = "REST",
      interaction = "Read / Write",
    ) {
      return {
        id,
        source,
        target,
        label,
        type: "smoothstep",
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#7865E8",
        },
        data: {
          protocol,
          interaction,
          description: "",
        },
        style: {
          stroke: "#7865E8",
          strokeWidth: 2,
        },
        labelStyle: {
          fill: "var(--text)",
          fontSize: 11,
        },
        labelBgStyle: {
          fill: "var(--surface)",
        },
      };
    }

    const generatedEdges = [
      createEdge("e1", "web", "gateway", "HTTPS"),
      createEdge("e2", "mobile", "gateway", "HTTPS"),
      createEdge("e3", "gateway", "auth"),
      createEdge("e4", "gateway", "product"),
      createEdge("e5", "gateway", "order"),
      createEdge(
        "e6",
        "product",
        "database",
        "Read / Write",
        "REST",
        "Read / Write",
      ),
      createEdge(
        "e7",
        "order",
        "database",
        "Read / Write",
        "REST",
        "Read / Write",
      ),
    ];

    if (hasPayment) {
      generatedEdges.push(
        createEdge("e8", "order", "payment"),
        createEdge("e9", "payment", "provider", "Payment API"),
      );
    }

    if (hasHighTraffic) {
      generatedEdges.push(createEdge("e10", "product", "cache", "Cache data"));
    }

    if (hasNotifications) {
      generatedEdges.push(
        createEdge("e11", "order", "broker", "Events", "Async Events", "Event"),
        createEdge(
          "e12",
          "broker",
          "worker",
          "Async events",
          "Async Events",
          "Event",
        ),
      );
    }

    const validationError = validateArchitecture(
      generatedNodes,
      generatedEdges,
    );

    if (validationError) {
      setSaveMessage(validationError);
      return;
    }

    setNodes(generatedNodes);
    setEdges(generatedEdges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setSaveMessage("Architecture generated successfully.");

    requestAnimationFrame(() => {
      reactFlowInstance?.fitView({ padding: 0.2 });
    });
  }

  // ========================================
  // SELECTION
  // ========================================

  function handleNodeClick(event, node) {
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
    setSaveMessage("");
  }

  function handleEdgeClick(event, edge) {
    setSelectedEdgeId(edge.id);
    setSelectedNodeId(null);
    setSaveMessage("");
  }

  function clearSelection() {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }

  // ========================================
  // UPDATE SELECTED COMPONENT
  // ========================================

  function updateSelectedNode(field, value) {
    if (!selectedNodeId) return;

    if (field === "label") {
      const safeValue = sanitizeText(value, MAX_NODE_LABEL_LENGTH);

      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  label: safeValue,
                },
              }
            : node,
        ),
      );
    }

    if (field === "category" && allowedCategories.includes(value)) {
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === selectedNodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  category: value,
                },
              }
            : node,
        ),
      );
    }

    setSaveMessage("");
  }

  // ========================================
  // UPDATE SELECTED CONNECTION
  // ========================================

  function updateSelectedEdge(field, value) {
    if (!selectedEdgeId) return;

    let safeValue;

    if (field === "protocol") {
      if (!allowedProtocols.includes(value)) return;
      safeValue = value;
    } else if (field === "interaction") {
      if (!allowedInteractions.includes(value)) return;
      safeValue = value;
    } else if (field === "description") {
      safeValue = sanitizeText(value, MAX_EDGE_DESCRIPTION_LENGTH);
    } else {
      return;
    }

    setEdges((currentEdges) =>
      currentEdges.map((edge) => {
        if (edge.id !== selectedEdgeId) {
          return edge;
        }

        return {
          ...edge,
          data: {
            ...(edge.data || {}),
            [field]: safeValue,
          },
          label:
            field === "protocol" || field === "interaction"
              ? `${field === "protocol" ? safeValue : edge.data?.protocol || "REST"} · ${field === "interaction" ? safeValue : edge.data?.interaction || "Read / Write"}`
              : edge.label,
        };
      }),
    );

    setSaveMessage("");
  }

  // ========================================
  // DELETE COMPONENT
  // ========================================

  function deleteSelectedNode() {
    if (!selectedNodeId) return;

    const nodeId = selectedNodeId;

    setNodes((currentNodes) =>
      currentNodes.filter((node) => node.id !== nodeId),
    );

    setEdges((currentEdges) =>
      currentEdges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId,
      ),
    );

    clearSelection();
    setSaveMessage("");
  }

  // ========================================
  // DELETE CONNECTION
  // ========================================

  function deleteSelectedEdge() {
    if (!selectedEdgeId) return;

    const edgeId = selectedEdgeId;

    setEdges((currentEdges) =>
      currentEdges.filter((edge) => edge.id !== edgeId),
    );

    clearSelection();
    setSaveMessage("");
  }

  // ========================================
  // SAVE ARCHITECTURE
  // ========================================

  function handleSaveArchitecture() {
    const validationError = validateArchitecture(nodes, edges);

    if (validationError) {
      setSaveMessage(validationError);
      return;
    }

    const safeNodes = nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        label: sanitizeText(node.data?.label, MAX_NODE_LABEL_LENGTH),
      },
    }));

    const safeEdges = edges.map((edge) => ({
      ...edge,
      label:
        typeof edge.label === "string"
          ? sanitizeText(edge.label, MAX_NODE_LABEL_LENGTH)
          : edge.label,
      data: {
        ...edge.data,
        protocol: edge.data?.protocol || "REST",
        interaction: edge.data?.interaction || "Read / Write",
        description: sanitizeText(
          edge.data?.description,
          MAX_EDGE_DESCRIPTION_LENGTH,
        ),
      },
    }));

    try {
      saveArchitecture(projectId, {
        nodes: safeNodes,
        edges: safeEdges,
      });

      setNodes(safeNodes);
      setEdges(safeEdges);
      setSaveMessage("Architecture saved successfully!");
    } catch (error) {
      console.error("Unable to save architecture:", error);
      setSaveMessage("Unable to save architecture.");
    }
  }

  // ========================================
  // RESTORE ARCHITECTURE
  // ========================================

  function handleRestoreArchitecture() {
    try {
      const architecture = getArchitecture(projectId);

      const restoredNodes = Array.isArray(architecture?.nodes)
        ? architecture.nodes
        : [];

      const restoredEdges = Array.isArray(architecture?.edges)
        ? architecture.edges
        : [];

      const validationError = validateArchitecture(
        restoredNodes,
        restoredEdges,
      );

      if (validationError) {
        setSaveMessage(`Cannot restore architecture: ${validationError}`);
        return;
      }

      setNodes(restoredNodes);
      setEdges(restoredEdges);
      clearSelection();

      requestAnimationFrame(() => {
        reactFlowInstance?.fitView({ padding: 0.2 });
      });

      setSaveMessage("Saved architecture restored.");
    } catch (error) {
      console.error("Unable to restore architecture:", error);
      setSaveMessage("Unable to restore architecture.");
    }
  }

  // ========================================
  // SELECTED ITEMS
  // ========================================

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId);

  // ========================================
  // LOADING STATE
  // ========================================

  if (projectLoading) {
    return (
      <main className="architecture-page">
        <p>Loading architecture workspace...</p>
      </main>
    );
  }

  // ========================================
  // PROJECT NOT FOUND
  // ========================================

  if (!project) {
    return (
      <main className="architecture-page">
        <h2>Project not found</h2>
        <Link to={`${routePrefix}/dashboard`}>Back to Dashboard</Link>
      </main>
    );
  }

  const requirements = project.requirements || {};

  // ========================================
  // MAIN WORKSPACE
  // ========================================

  return (
    <main
      className="architecture-page"
      data-theme={localStorage.getItem("archpilot-theme") || "dark"}
    >
      <header className="architecture-topbar">
        <div className="architecture-brand">
          <Link
            to={`${routePrefix}/dashboard`}
            className="architecture-back-link"
          >
            <span>←</span> Projects
          </Link>

          <div className="architecture-title-group">
            <h1>Architecture Designer</h1>
            <p>{project.name}</p>
          </div>
        </div>

        <div className="architecture-header-actions">
          <button
            type="button"
            onClick={generateArchitecture}
            className="generate-architecture-button"
          >
            Generate
          </button>

          <button type="button" onClick={handleRestoreArchitecture}>
            Restore
          </button>

          <button
            type="button"
            onClick={handleSaveArchitecture}
            className="save-architecture-button"
          >
            Save Architecture
          </button>
        </div>
      </header>

      {saveMessage && (
        <p
          className="architecture-save-message"
          role="status"
          aria-live="polite"
        >
          {saveMessage}
        </p>
      )}

      <section className="requirements-strip">
        <div className="requirements-strip-heading">
          <div>
            <span className="section-eyebrow">PROJECT OVERVIEW</span>
            <h2>System Requirements</h2>
          </div>

          <Link
            to={`${routePrefix}/projects/${projectId}/requirements`}
            className="edit-requirements-link"
          >
            Edit requirements →
          </Link>
        </div>

        <div className="requirements-strip-grid">
          <div className="requirement-item">
            <span>Expected traffic</span>
            <strong>{requirements.expectedTraffic || "Not specified"}</strong>
          </div>

          <div className="requirement-item">
            <span>Latency</span>
            <strong>{requirements.latency || "Not specified"}</strong>
          </div>

          <div className="requirement-item">
            <span>Availability</span>
            <strong>{requirements.availability || "Not specified"}</strong>
          </div>

          <div className="requirement-item">
            <span>Scalability</span>
            <strong>{requirements.scalability || "Not specified"}</strong>
          </div>
        </div>
      </section>

      <section className="architecture-workspace">
        {/* LEFT COMPONENT PALETTE */}

        <aside className="component-palette">
          <div className="palette-header">
            <div>
              <span className="section-eyebrow">BUILD YOUR SYSTEM</span>
              <h2>Components</h2>
            </div>

            <span className="component-count">
              {componentGroups.reduce(
                (total, group) => total + group.items.length,
                0,
              )}
            </span>
          </div>

          <p className="palette-intro">
            Drag components onto the canvas or click to add them.
          </p>

          {componentGroups.map((group, index) => (
            <section className="palette-group" key={group.title}>
              <div className="palette-group-header">
                <h3>{group.title}</h3>
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>

              <div className="palette-items">
                {group.items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className="palette-item"
                    draggable
                    onDragStart={(event) =>
                      handlePaletteDragStart(event, item, group.title)
                    }
                    onClick={() => addComponent(item, group.title)}
                  >
                    <span className="palette-item-icon">+</span>

                    <span>{item}</span>

                    <span className="palette-drag-indicator">⠿</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </aside>

        {/* CENTER CANVAS */}

        <section className="architecture-canvas-panel">
          <div className="canvas-toolbar">
            <div>
              <span className="section-eyebrow">DESIGN AREA</span>
              <h2>System Architecture</h2>
              <p>
                {nodes.length} components · {edges.length} connections
              </p>
            </div>

            <div className="canvas-toolbar-actions">
              <span className="canvas-status">
                <span className="canvas-status-dot"></span>
                Workspace
              </span>
            </div>
          </div>

          <div className="canvas-instructions">
            <span>Drag to move</span>
            <span>Connect handles to create relationships</span>
            <span>Select an item to edit</span>
          </div>

          <ArchitectureCanvas
            nodes={nodes}
            setNodes={setNodes}
            edges={edges}
            setEdges={setEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onPaneClick={clearSelection}
            onInit={setReactFlowInstance}
            onCanvasError={handleCanvasError}
            maxNodes={MAX_NODES}
            maxEdges={MAX_EDGES}
          />
        </section>

        {/* RIGHT PROPERTIES PANEL */}

        <aside className="properties-panel">
          <div className="properties-header">
            <span className="section-eyebrow">CONFIGURATION</span>

            <h2>Properties</h2>

            <p>Inspect and configure your architecture.</p>
          </div>

          {selectedNode ? (
            <div className="property-editor">
              <span className="property-type">COMPONENT</span>

              <label htmlFor="node-label">Component name</label>

              <input
                id="node-label"
                type="text"
                value={selectedNode.data?.label || ""}
                maxLength={MAX_NODE_LABEL_LENGTH}
                required
                onChange={(event) =>
                  updateSelectedNode("label", event.target.value)
                }
              />

              <small>
                {(selectedNode.data?.label || "").length}/
                {MAX_NODE_LABEL_LENGTH} characters
              </small>

              <label htmlFor="node-category">Category</label>

              <select
                id="node-category"
                value={selectedNode.data?.category || ""}
                onChange={(event) =>
                  updateSelectedNode("category", event.target.value)
                }
              >
                {componentGroups.map((group) => (
                  <option key={group.title} value={group.title}>
                    {group.title}
                  </option>
                ))}
              </select>

              <div className="property-id">
                <span>Component ID</span>
                <p>{selectedNode.id}</p>
              </div>

              <button
                type="button"
                className="delete-component-button"
                onClick={deleteSelectedNode}
              >
                Delete Component
              </button>
            </div>
          ) : selectedEdge ? (
            <div className="property-editor">
              <span className="property-type">CONNECTION</span>

              <label htmlFor="edge-protocol">Protocol</label>

              <select
                id="edge-protocol"
                value={selectedEdge.data?.protocol || "REST"}
                onChange={(event) =>
                  updateSelectedEdge("protocol", event.target.value)
                }
              >
                {allowedProtocols.map((protocol) => (
                  <option key={protocol} value={protocol}>
                    {protocol}
                  </option>
                ))}
              </select>

              <label htmlFor="edge-interaction">Interaction</label>

              <select
                id="edge-interaction"
                value={selectedEdge.data?.interaction || "Read / Write"}
                onChange={(event) =>
                  updateSelectedEdge("interaction", event.target.value)
                }
              >
                {allowedInteractions.map((interaction) => (
                  <option key={interaction} value={interaction}>
                    {interaction}
                  </option>
                ))}
              </select>

              <label htmlFor="edge-description">Description</label>

              <textarea
                id="edge-description"
                rows={4}
                maxLength={MAX_EDGE_DESCRIPTION_LENGTH}
                value={selectedEdge.data?.description || ""}
                onChange={(event) =>
                  updateSelectedEdge("description", event.target.value)
                }
                placeholder="Describe this connection..."
              />

              <small>
                {(selectedEdge.data?.description || "").length}/
                {MAX_EDGE_DESCRIPTION_LENGTH} characters
              </small>

              <div className="property-id">
                <span>Source</span>
                <p>{selectedEdge.source}</p>
              </div>

              <div className="property-id">
                <span>Target</span>
                <p>{selectedEdge.target}</p>
              </div>

              <button
                type="button"
                className="delete-component-button"
                onClick={deleteSelectedEdge}
              >
                Delete Connection
              </button>
            </div>
          ) : (
            <div className="empty-properties">
              <div className="empty-properties-icon">⌖</div>

              <h3>Nothing selected</h3>

              <p>
                Select a component or connection on the canvas to view and edit
                its properties.
              </p>
            </div>
          )}
        </aside>
      </section>
      <MermaidDiagram nodes={nodes} edges={edges} />
    </main>
  );
}

export default ArchitecturePage;

function escapeMermaidText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "#quot;")
    .replace(/\|/g, "#124;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/[\r\n]+/g, " ")
    .trim();
}

export function generateMermaid(nodes = [], edges = []) {
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return "flowchart LR\n  empty[Invalid architecture data]";
  }

  if (nodes.length === 0) {
    return "flowchart LR\n  empty[No components added yet]";
  }

  // Generate safe Mermaid IDs instead of using React Flow IDs.
  const nodeIdMap = new Map();

  nodes.forEach((node, index) => {
    nodeIdMap.set(node.id, `component${index + 1}`);
  });

  const lines = ["flowchart LR"];

  // Generate component definitions.
  nodes.forEach((node) => {
    const safeId = nodeIdMap.get(node.id);
    const label = escapeMermaidText(node.data?.label || "Unnamed Component");

    lines.push(`  ${safeId}["${label}"]`);
  });

  // Generate connections between components.
  edges.forEach((edge) => {
    const source = nodeIdMap.get(edge.source);
    const target = nodeIdMap.get(edge.target);

    // Ignore connections referencing missing components.
    if (!source || !target) return;

    const protocol = escapeMermaidText(edge.data?.protocol || "REST");
    const interaction = escapeMermaidText(
      edge.data?.interaction || "Read / Write",
    );
    const description = escapeMermaidText(edge.data?.description || "");

    const connectionLabel = description
      ? `${protocol} · ${interaction} · ${description}`
      : `${protocol} · ${interaction}`;

    lines.push(`  ${source} -->|"${connectionLabel}"| ${target}`);
  });

  return lines.join("\n");
}

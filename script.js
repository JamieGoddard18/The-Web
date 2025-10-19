let cy;

let swOn = true;


// Load graph data and optional saved layout
Promise.all([
  fetch("graph-data.json").then((res) => res.json()),
  fetch("layout.json").then((res) => (res.ok ? res.json() : {})),
]).then(([data, savedPositions]) => {
  const elements = [];
  const addedNodes = new Set();
  const addedEdges = new Set();

  data.forEach((row) => {
    const source = String(row.from || "").trim();
    //console.log("source",source);
    const target = String(row.to || "").trim();
    const type = String(row["type "] || row.type || "").trim();
    const group_from = String(row.group_from || "").trim();
    const group_to = String(row.group_to || "").trim();

    const formatLabel = (name) => name.replace(/\s+/, "\n");

    if (source && !addedNodes.has(source)) {
      elements.push({
        data: {
          id: source,
          label: formatLabel(source),
          group: group_from,
        },
        position: savedPositions[source] || undefined,
      });
      addedNodes.add(source);
    }

    if (target && !addedNodes.has(target)) {
      elements.push({
        data: {
          id: target,
          label: formatLabel(target),
          group: group_to,
        },
        position: savedPositions[target] || undefined,
      });
      addedNodes.add(target);
    }

    const edgeKey = source + "->" + target;
    const reverseKey = target + "->" + source;

    if (
      source &&
      target &&
      !addedEdges.has(edgeKey) &&
      !addedEdges.has(reverseKey)
    ) {
      elements.push({
        data: {
          source,
          target,
          type,
        },
      });
      addedEdges.add(edgeKey);
    }
  });

  renderGraph(elements);
});

function renderGraph(elements) {
  const hasPositions = elements.some((ele) => ele.position?.x !== undefined);

  cy = cytoscape({
    container: document.getElementById("cy"),
    elements,
    minZoom: 0.5,
    maxZoom: 5,

    layout: hasPositions
      ? { name: "preset" }
      : {
          name: "fcose",
          quality: "default",
          randomize: true,
          nodeSeparation: 150,
          nodeRepulsion: 450000,
          idealEdgeLength: 120,
          edgeElasticity: 0.2,
          gravity: 0.3,
          animate: true,
          animationDuration: 1000,
          fit: true,
        },

    style: [
      {
        selector: "node",
        style: {
          label: "data(label)",
          "text-valign": "center",
          "text-halign": "center",
          "background-color": "pink",
          "border-color": "black",
          "border-width": 0.5,
          color: "#000000",
          "font-size": 6,
          "font-weight": "bold",
          "text-wrap": "wrap",
          "text-max-width": 80,
          "overlay-opacity": 0 
        },
      },
      {
        selector: "edge",
        style: {
          width: 1.5,
          "overlay-opacity": 0, 
          "curve-style": "bezier",
          "line-color": "#a974ff",
          "target-arrow-shape": "none",
          color: "#ddd",
          "font-size": 10,
          "text-background-color": "#1a0033",
          "text-background-opacity": 0.7,
          "text-background-padding": 3,
          "text-background-shape": "roundrectangle",
        },
      },
      {
        selector: "core",
        style: {
          "active-bg-opacity": 0 
          }
      },
      {
        selector: 'edge[type="slept_with"]',
        style: { "line-color": "#3070b3" },
      },
      {
        selector: 'edge[type="snap"]',
        style: { "line-color": "#FFFF00" },
      },
      {
        selector: 'edge[type="strava_rizz"]',
        style: { "line-color": "orange" },
      },
      { selector: 'edge[type="pulled"]', style: { "line-color": "#46a64e" } },
      { selector: 'edge[type="dated\/dating"]', style: { "line-color": "#ff2424" } },
      {
        selector: 'edge[type="hong_dong"]',
        style: { "line-color": "#FF69B4" },
      },
      {
        selector: 'node[group="euoc"]',
        style: { "background-color": "white" },
      },
      {
        selector: 'node[group="hh"]',
        style: { "background-color": "#88e788" },
      },
      { selector: 'node[group="o"]', style: { "background-color": "#FFEE8C" } },
    ],
  });

  cy.nodes().ungrabify().unselectify();

  cy.once("layoutstop", () => {
    cy.fit(40);
  });
}

// Save layout as JSON
const saveBtn = document.getElementById("save-layout-btn");
if (saveBtn) {
  saveBtn.style.display = "inline-block"; // Make button visible

  saveBtn.addEventListener("click", () => {
    if (!cy) {
      alert("Graph not initialized");
      return;
    }

    const layoutData = {};
    cy.nodes().forEach((node) => {
      const pos = node.position();
      layoutData[node.id()] = { x: pos.x, y: pos.y };
    });

    const json = JSON.stringify(layoutData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "layout.json";
    a.click();
    URL.revokeObjectURL(url);
  });
}

document.getElementById("search-button").addEventListener("click", () => {
  var name = document.getElementById("search-input").value.trim();
  var node = cy.nodes().filter(n => n.id().trim().toLowerCase() == name.toLowerCase());
  console.log("name", name.toLowerCase());
  console.log("node", node.id().trim().toLowerCase());

  if (!node.empty()) {
    cy.animate(
      {
        fit: {
          eles: node,
          padding: 20,
        },
      },
      {
        duration: 1000,
      }
    );
  } else {
    let failString = "We could not find : "+name+". Ensure proper Spelling, e.g Barney Stevenson-Barnes";
    alert(failString);
  }
});


/// hide/show code for connection types
const edgeTypeVisibility = {}; // Track visibility per type

document.querySelectorAll(".legend-item").forEach((item) => {
  const type = item.getAttribute("data-type");
  edgeTypeVisibility[type] = true; // default: visible

  item.addEventListener("click", () => {
    edgeTypeVisibility[type] = !edgeTypeVisibility[type];

    cy.edges().forEach((edge) => {
      if (edge.data("type") === type) {
        edge.style("opacity", edgeTypeVisibility[type] ? 1 : 0);
      }
    });
    //make legend greyed out to show 
    item.style.opacity = edgeTypeVisibility[type] ? "1" : "0.4";
  });
});

function darkMode() { 
  if (!(document.getElementById('cy').style.backgroundColor == "black")) {
    document.getElementById('cy').style.backgroundColor = "black"; 
    document.getElementById('cy').style.backgroundImage = "linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)";
  }
  else {
    document.getElementById('cy').style.backgroundColor = "white"; 
    document.getElementById('cy').style.backgroundImage = "linear-gradient(to right, rgba(0, 0, 0, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.08) 1px, transparent 1px)";
  }
  
}
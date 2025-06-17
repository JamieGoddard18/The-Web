let cy; // Declare Cytoscape instance globally

// Get Graph Data and Layout from Backend
Promise.all([
  fetch('graph-data.json').then(res => res.json()),
  fetch('/layout').then(res => {
    if (!res.ok) return {};
    return res.json();
  })
]).then(([data, savedPositions]) => {
  const elements = [];
  const addedNodes = new Set();
  const addedEdges = new Set();

  data.forEach(row => {
    const source = row.from?.trim?.() || null;
    const target = row.to?.trim?.() || null;
    const type = row['type ']?.trim?.() || row.type?.trim?.() || '';
    const group_from = row.group_from?.trim?.() || '';
    const group_to = row.group_to?.trim?.() || '';

    if (source && !addedNodes.has(source)) {
      elements.push({
        data: { id: source, group: group_from },
        position: savedPositions[source] || undefined
      });
      addedNodes.add(source);
    }

    if (target && !addedNodes.has(target)) {
      elements.push({
        data: { id: target, group: group_to },
        position: savedPositions[target] || undefined
      });
      addedNodes.add(target);
    }

    if (source && target &&
        !addedEdges.has(source + target) &&
        !addedEdges.has(target + source)) {
      elements.push({
        data: {
          source: source,
          target: target,
          type: type
        }
      });
      addedEdges.add(source + target);
    }
  });

  renderGraph(elements);
});

function renderGraph(elements) {
  // Check if any node has a position defined
  const hasPositions = elements.some(ele => ele.position && ele.position.x !== undefined && ele.position.y !== undefined);

  const layoutName = hasPositions ? 'preset' : 'cose';

  cy = cytoscape({
    container: document.getElementById('cy'),
    elements,
    minZoom: 2,
    maxZoom: 5,
    wheelSensitivity: 0.2,
    layout: { name: layoutName },

    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(id)',
          'text-valign': 'center',
          'text-halign': 'center',
          'background-color': 'pink',
          'border-color': 'black',
          'border-width': 0.5,
          'color': 'white',
          'font-size': 5,
          'text-outline-color': 'black',
          'text-outline-width': 0.75,
          'transition-property': 'background-color, line-color',
          'transition-duration': '0.5s'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'curve-style': 'bezier',
          'line-color': '#a974ff',
          'target-arrow-color': '#a974ff',
          'target-arrow-shape': 'none',
          'font-size': 10,
          'text-background-color': '#1a0033',
          'text-background-opacity': 0.7,
          'text-background-padding': 3,
          'text-background-shape': 'roundrectangle',
          'color': '#ddd'
        }
      },
      { selector: 'edge[type="slept_with"]', style: { 'line-color': 'blue' } },
      { selector: 'edge[type="pulled"]', style: { 'line-color': 'green' } },
      { selector: 'edge[type="dated"]', style: { 'line-color': 'red' } },
      { selector: 'node[group="euoc"]', style: { 'background-color': 'white' } },
      { selector: 'node[group="hh"]', style: { 'background-color': 'green' } },
      { selector: 'node[group="o"]', style: { 'background-color': 'yellow' } }
    ]
  });

  // Clamp pan to bounding box
  cy.once('layoutstop', () => {
    cy.fit(40);
    const bounds = cy.extent();
    const padding = -200;
    let raf = null;

    cy.on('pan', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const zoom = cy.zoom();
        const pan = cy.pan();
        const container = cy.container().getBoundingClientRect();
        const width = container.width / zoom;
        const height = container.height / zoom;

        const minX = -bounds.x2 + padding;
        const maxX = -bounds.x1 + width - padding;
        const minY = -bounds.y2 + padding;
        const maxY = -bounds.y1 + height - padding;

        const newPan = {
          x: Math.max(Math.min(pan.x, maxX), minX),
          y: Math.max(Math.min(pan.y, maxY), minY)
        };

        cy.pan(newPan);
        raf = null;
      });
    });
  });
}

// Save layout to backend
document.getElementById('save-layout-btn')?.addEventListener('click', () => {
  if (!cy) return alert('Graph not loaded yet.');

  const positions = {};
  cy.nodes().forEach(node => {
    positions[node.id()] = node.position();
  });

  fetch('/layout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(positions)
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to save');
    return res.json();
  })
  .then(() => alert('Layout saved!'))
  .catch(() => alert('Failed to save layout.'));
});

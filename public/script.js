let cy;

// Fetch data and saved layout
Promise.all([
  fetch('graph-data.json').then(res => res.json()),
  fetch('/layout').then(res => res.ok ? res.json() : {})
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
  const hasPositions = elements.some(ele => ele.position?.x !== undefined);

  cy = cytoscape({
    container: document.getElementById('cy'),
    elements,
    minZoom: 0.5,
    maxZoom: 5,
    wheelSensitivity: 0.2,

    layout: hasPositions
  ? { name: 'preset' }
  : {
      name: 'fcose',
        quality: 'default',
        randomize: true,
        nodeSeparation: 150,
        nodeRepulsion: 450000,
        idealEdgeLength: 120,
        edgeElasticity: 0.2,
        gravity: 0.3,
        animate: true,
        animationDuration: 1000,
        fit: true
    },

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
          'color': '#ffffff',
          'font-size': 5,
          'font-weight': 'bold',
          'text-outline-color': '#000000',
          'text-outline-width': 1,
          'text-wrap': 'wrap',
          'text-max-width': 80
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 1.5,
          'curve-style': 'bezier',
          'line-color': '#a974ff',
          'target-arrow-shape': 'none',
          'color': '#ddd',
          'font-size': 10,
          'text-background-color': '#1a0033',
          'text-background-opacity': 0.7,
          'text-background-padding': 3,
          'text-background-shape': 'roundrectangle'
        }
      },
      { selector: 'edge[type="slept_with"]', style: { 'line-color': '#3070b3' } },
      { selector: 'edge[type="pulled"]', style: { 'line-color': '#46a64e' } },
      { selector: 'edge[type="dated"]', style: { 'line-color': '#ff2424' } },
      { selector: 'node[group="euoc"]', style: { 'background-color': 'white' } },
      { selector: 'node[group="hh"]', style: { 'background-color': '#88e788' } },
      { selector: 'node[group="o"]', style: { 'background-color': '#FFEE8C' } }
    ]
  });

  cy.once('layoutstop', () => {
    cy.fit(40);
  });
}

// Save layout
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
      alert('Layout saved!');
    })
    .catch(() => alert('Failed to save layout.'));
});

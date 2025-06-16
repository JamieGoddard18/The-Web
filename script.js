fetch('graph-data.json')
  .then(response => response.json())
  .then(data => {
    const elements = [];
    const addedNodes = new Set();
    const addedEdges = new Set();

    data.forEach(row => {
      const source = row.source.trim();
      const target = row.target.trim();
      const type = row['type ']?.trim() || row.type?.trim() || '';

      if (!addedNodes.has(source)) {
        elements.push({ data: { id: source } });
        addedNodes.add(source);
      }
      if (!addedNodes.has(target)) {
        elements.push({ data: { id: target } });
        addedNodes.add(target);
      }

      if (!addedEdges.has(source + target) && !addedEdges.has(target + source)) {
        elements.push({
          data: {
            source: source,
            target: target,
            type: type,
          }
        });
        addedEdges.add(source + target);
      }
    });

    renderGraph(elements);
  });

function renderGraph(elements) {
  const savedPositions = JSON.parse(localStorage.getItem('graphLayoutPositions') || '{}');

  if (Object.keys(savedPositions).length > 0) {
    elements.forEach(ele => {
      if (ele.data && ele.data.id && savedPositions[ele.data.id]) {
        ele.position = savedPositions[ele.data.id];
      }
    });
  }

  const cy = cytoscape({
    container: document.getElementById('cy'),
    elements,
    minZoom: 2,
    maxZoom: 5,
    wheelSensitivity: 0.2,

    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(id)',
          'text-valign': 'center',
          'text-halign': 'center',
          'background-color': '#A9F081',
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
      { selector: 'edge[type="dated"]', style: { 'line-color': 'red' } }
    ],

    layout: Object.keys(savedPositions).length > 0
      ? { name: 'preset' }
      : { name: 'cose' }
  });

  // Clamp pan to bounding box
  cy.once('layoutstop', () => {
    cy.fit(40);
    const bounds = cy.extent();
    const padding = 100;
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

  // Save button handler
  document.getElementById('save-layout-btn').addEventListener('click', () => {
    const positions = {};
    cy.nodes().forEach(node => {
      positions[node.id()] = node.position();
    });
    localStorage.setItem('graphLayoutPositions', JSON.stringify(positions));
    alert("Layout saved!");
  });
}

// Delete button handler
document.getElementById('delete-layout-btn').addEventListener('click', () => {
    localStorage.removeItem('graphLayoutPositions');
    alert("Saved layout deleted. Reload the page to reset layout.");
});

// Download 
document.getElementById('download-layout-btn').addEventListener('click', () => {
  const positions = {};
  cy.nodes().forEach(node => {
    positions[node.id()] = node.position();
 });

  const blob = new Blob([JSON.stringify(positions, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'layout.json';
  a.click();
  URL.revokeObjectURL(url);
});

// Download layout
document.getElementById('save-layout-btn').addEventListener('click', () => {
  const positions = {};
  cy.nodes().forEach(node => {
    positions[node.id()] = node.position();
  });

  const blob = new Blob([JSON.stringify(positions, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'graph-layout.json';
  a.click();
  URL.revokeObjectURL(url);
});

// Trigger upload
document.getElementById('upload-layout-btn').addEventListener('click', () => {
  document.getElementById('layout-file-input').click();
});

// Handle uploaded file
document.getElementById('layout-file-input').addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const savedPositions = JSON.parse(e.target.result);
      cy.nodes().forEach(node => {
        const pos = savedPositions[node.id()];
        if (pos) {
          node.position(pos);
        }
      });
      cy.layout({ name: 'preset' }).run();
    } catch (err) {
      alert('Failed to load layout: ' + err.message);
    }
  };
  reader.readAsText(file);
});


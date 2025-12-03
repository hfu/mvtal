/**
 * UI Module
 * Handles DOM manipulation and rendering
 */

/**
 * Create DOM elements for the application
 * @returns {Object} Object containing DOM element references
 */
export function getElements() {
  return {
    urlInput: document.getElementById('urlInput'),
    fetchBtn: document.getElementById('fetchBtn'),
    sampleCountInput: document.getElementById('sampleCount'),
    showAllValuesCheckbox: document.getElementById('showAllValues'),
    statusDiv: document.getElementById('status'),
    resultsDiv: document.getElementById('results')
  };
}

/**
 * Show status message
 * @param {HTMLElement} statusDiv - The status div element
 * @param {string} message - Status message to display
 * @param {string} type - Status type: 'loading', 'error', or 'success'
 */
export function showStatus(statusDiv, message, type) {
  statusDiv.textContent = message;
  statusDiv.className = type;
}

/**
 * Hide status message
 * @param {HTMLElement} statusDiv - The status div element
 */
export function hideStatus(statusDiv) {
  statusDiv.className = '';
  statusDiv.style.display = 'none';
}

/**
 * Format type for display as HTML badge
 * @param {string[]} types - Array of type names
 * @returns {string} HTML formatted types
 */
export function formatTypes(types) {
  if (types.length === 1) {
    return `<span class="type-badge type-${types[0]}">${types[0]}</span>`;
  }
  return `<span class="type-badge type-mixed">${types.join(', ')}</span>`;
}

/**
 * Format sample values for display
 * @param {Array} values - Array of {value, count} objects
 * @param {number} limit - Maximum number of values to show
 * @param {boolean} showAll - Whether to show all values
 * @returns {string} Formatted sample values
 */
export function formatSampleValuesForDisplay(values, limit, showAll) {
  const displayValues = showAll ? values : values.slice(0, limit);
  return displayValues.map(v => `${v.value} (${v.count})`).join(', ');
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Create a layer section element
 * @param {string} layerName - Layer name
 * @param {Object} layerInfo - Layer analysis data
 * @param {number} sampleLimit - Number of sample values to show
 * @param {boolean} showAll - Whether to show all values
 * @param {Function} onDownloadCSV - CSV download handler
 * @param {Function} onDownloadMD - Markdown download handler
 * @returns {HTMLElement} Layer section element
 */
export function createLayerSection(layerName, layerInfo, sampleLimit, showAll, onDownloadCSV, onDownloadMD) {
  const section = document.createElement('div');
  section.className = 'layer-section';
  
  const header = document.createElement('div');
  header.className = 'layer-header';
  header.innerHTML = `
    <span class="layer-name">📦 ${escapeHtml(layerName)}</span>
    <span class="layer-info">${layerInfo.featureCount} features, ${layerInfo.attributes.length} attributes</span>
  `;
  
  const content = document.createElement('div');
  content.className = 'layer-content';
  
  // Export buttons
  const exportDiv = document.createElement('div');
  exportDiv.className = 'export-buttons';
  
  const csvBtn = document.createElement('button');
  csvBtn.textContent = '📥 CSV';
  csvBtn.onclick = onDownloadCSV;
  
  const mdBtn = document.createElement('button');
  mdBtn.textContent = '📥 Markdown';
  mdBtn.onclick = onDownloadMD;
  
  exportDiv.appendChild(csvBtn);
  exportDiv.appendChild(mdBtn);
  content.appendChild(exportDiv);
  
  // Attributes table
  if (layerInfo.attributes.length > 0) {
    const table = createAttributeTable(layerInfo.attributes, sampleLimit, showAll);
    content.appendChild(table);
  } else {
    const emptyMsg = document.createElement('p');
    emptyMsg.style.color = '#666';
    emptyMsg.textContent = '属性がありません。';
    content.appendChild(emptyMsg);
  }
  
  // Toggle expand/collapse
  header.onclick = () => {
    content.classList.toggle('expanded');
  };
  
  section.appendChild(header);
  section.appendChild(content);
  
  return section;
}

/**
 * Create attribute table element
 * @param {Array} attributes - Array of attribute data
 * @param {number} sampleLimit - Number of sample values to show
 * @param {boolean} showAll - Whether to show all values
 * @returns {HTMLElement} Table element
 */
export function createAttributeTable(attributes, sampleLimit, showAll) {
  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>属性キー</th>
        <th>型</th>
        <th>出現回数</th>
        <th>サンプル値</th>
      </tr>
    </thead>
    <tbody>
      ${attributes.map(attr => `
        <tr>
          <td><strong>${escapeHtml(attr.key)}</strong></td>
          <td>${formatTypes(attr.types)}</td>
          <td>${attr.count}</td>
          <td class="sample-values">${escapeHtml(formatSampleValuesForDisplay(attr.values, sampleLimit, showAll))}</td>
        </tr>
      `).join('')}
    </tbody>
  `;
  return table;
}

/**
 * Render results to DOM
 * @param {HTMLElement} resultsDiv - Results container element
 * @param {Object} layersData - Analysis result
 * @param {number} sampleLimit - Number of sample values to show
 * @param {boolean} showAll - Whether to show all values
 * @param {Function} downloadCSV - CSV download function
 * @param {Function} downloadMarkdown - Markdown download function
 */
export function renderResults(resultsDiv, layersData, sampleLimit, showAll, downloadCSV, downloadMarkdown) {
  resultsDiv.innerHTML = '';
  
  if (Object.keys(layersData).length === 0) {
    resultsDiv.innerHTML = '<p style="padding: 20px; color: #666;">レイヤーが見つかりませんでした。</p>';
    return;
  }
  
  let isFirst = true;
  for (const [layerName, layerInfo] of Object.entries(layersData)) {
    const section = createLayerSection(
      layerName,
      layerInfo,
      sampleLimit,
      showAll,
      () => downloadCSV(layerName, layerInfo),
      () => downloadMarkdown(layerName, layerInfo, sampleLimit, showAll)
    );
    
    resultsDiv.appendChild(section);
    
    // Auto-expand first layer
    if (isFirst) {
      section.querySelector('.layer-content').classList.add('expanded');
      isFirst = false;
    }
  }
}

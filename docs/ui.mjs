/**
 * UI Module
 * Handles DOM manipulation and rendering
 */

import { CSS_CLASSES, TABLE_HEADERS, MESSAGES } from './config.mjs';

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
 * Types are internal values (null, boolean, number, string, unknown) so they are safe
 * @param {string[]} types - Array of type names
 * @returns {string} HTML formatted types
 */
export function formatTypes(types) {
  // Types are internal constants from VALUE_TYPES, not user input, so safe to use directly
  const safeTypes = types.map(t => escapeHtml(String(t)));
  if (safeTypes.length === 1) {
    return `<span class="type-badge type-${safeTypes[0]}">${safeTypes[0]}</span>`;
  }
  return `<span class="type-badge type-mixed">${safeTypes.join(', ')}</span>`;
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
  // Return array of formatted strings, let caller handle joining and escaping
  return displayValues.map(v => `${v.value} (${v.count})`);
}

/**
 * HTML entity map for escaping
 */
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/**
 * Escape HTML to prevent XSS
 * Uses string replacement for better performance
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str).replace(/[&<>"']/g, char => HTML_ENTITIES[char]);
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
  section.className = CSS_CLASSES.LAYER_SECTION;
  
  const header = document.createElement('button');
  header.className = CSS_CLASSES.LAYER_HEADER;
  header.setAttribute('aria-expanded', 'false');
  header.setAttribute('aria-label', `Toggle ${layerName} layer details`);
  header.innerHTML = `
    <span class="${CSS_CLASSES.LAYER_NAME}">📦 ${escapeHtml(layerName)}</span>
    <span class="${CSS_CLASSES.LAYER_INFO}">${layerInfo.featureCount} features, ${layerInfo.attributes.length} attributes</span>
  `;
  
  const content = document.createElement('div');
  content.className = CSS_CLASSES.LAYER_CONTENT;
  
  // Export buttons
  const exportDiv = document.createElement('div');
  exportDiv.className = CSS_CLASSES.EXPORT_BUTTONS;
  
  const csvBtn = document.createElement('button');
  csvBtn.textContent = '📥 CSV';
  csvBtn.setAttribute('aria-label', `Download ${layerName} attributes as CSV`);
  csvBtn.onclick = onDownloadCSV;
  
  const mdBtn = document.createElement('button');
  mdBtn.textContent = '📥 Markdown';
  mdBtn.setAttribute('aria-label', `Download ${layerName} attributes as Markdown`);
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
    emptyMsg.textContent = MESSAGES.NO_ATTRIBUTES;
    content.appendChild(emptyMsg);
  }
  
  // Toggle expand/collapse with keyboard accessibility
  header.onclick = () => {
    const isExpanded = content.classList.toggle(CSS_CLASSES.LAYER_CONTENT_EXPANDED);
    header.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
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
        <th>${TABLE_HEADERS.KEY}</th>
        <th>${TABLE_HEADERS.TYPE}</th>
        <th>${TABLE_HEADERS.COUNT}</th>
        <th>${TABLE_HEADERS.SAMPLES}</th>
      </tr>
    </thead>
    <tbody>
      ${attributes.map(attr => `
        <tr>
          <td><strong>${escapeHtml(attr.key)}</strong></td>
          <td>${formatTypes(attr.types)}</td>
          <td>${attr.count}</td>
          <td class="${CSS_CLASSES.SAMPLE_VALUES}">${escapeHtml(formatSampleValuesForDisplay(attr.values, sampleLimit, showAll))}</td>
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
    resultsDiv.innerHTML = `<p style="padding: 20px; color: #666;">${MESSAGES.NO_LAYERS}</p>`;
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
      section.querySelector(`.${CSS_CLASSES.LAYER_CONTENT}`).classList.add(CSS_CLASSES.LAYER_CONTENT_EXPANDED);
      isFirst = false;
    }
  }
}

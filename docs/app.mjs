/**
 * MVT Attribute Lister - Main Application
 * Fetches and parses Mapbox Vector Tiles to display attribute information
 */

import Pbf from 'https://esm.sh/pbf@4';
import { VectorTile } from 'https://esm.sh/@mapbox/vector-tile@2';

// DOM Elements
const urlInput = document.getElementById('urlInput');
const fetchBtn = document.getElementById('fetchBtn');
const sampleCountInput = document.getElementById('sampleCount');
const showAllValuesCheckbox = document.getElementById('showAllValues');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');

// State
let currentData = null;

/**
 * Show status message
 * @param {string} message - Status message to display
 * @param {string} type - Status type: 'loading', 'error', or 'success'
 */
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = type;
}

/**
 * Hide status message
 */
function hideStatus() {
  statusDiv.className = '';
  statusDiv.style.display = 'none';
}

/**
 * Fetch MVT tile from URL
 * @param {string} url - The tile URL to fetch
 * @returns {Promise<ArrayBuffer>} The tile data as ArrayBuffer
 */
async function fetchTile(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
  }
  return await response.arrayBuffer();
}

/**
 * Parse MVT tile data
 * @param {ArrayBuffer} data - The tile data
 * @returns {VectorTile} Parsed vector tile
 */
function parseTile(data) {
  const pbf = new Pbf(new Uint8Array(data));
  return new VectorTile(pbf);
}

/**
 * Get the type of a value
 * @param {*} value - The value to check
 * @returns {string} The type name
 */
function getValueType(value) {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') return 'string';
  return 'unknown';
}

/**
 * Analyze layer attributes
 * @param {Object} layer - The vector tile layer
 * @returns {Object} Analysis result with attribute info
 */
function analyzeLayerAttributes(layer) {
  const attributes = {};
  const featureCount = layer.length;
  
  for (let i = 0; i < featureCount; i++) {
    const feature = layer.feature(i);
    const props = feature.properties;
    
    for (const [key, value] of Object.entries(props)) {
      if (!attributes[key]) {
        attributes[key] = {
          key,
          types: new Set(),
          count: 0,
          values: new Map()
        };
      }
      
      const attr = attributes[key];
      attr.count++;
      attr.types.add(getValueType(value));
      
      // Track value occurrences
      const valueStr = String(value);
      attr.values.set(valueStr, (attr.values.get(valueStr) || 0) + 1);
    }
  }
  
  // Convert to array and sort by count
  return Object.values(attributes).map(attr => ({
    key: attr.key,
    types: Array.from(attr.types),
    count: attr.count,
    values: Array.from(attr.values.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count }))
  })).sort((a, b) => b.count - a.count);
}

/**
 * Analyze entire tile
 * @param {VectorTile} tile - The parsed vector tile
 * @returns {Object} Analysis result for all layers
 */
function analyzeTile(tile) {
  const layers = {};
  
  for (const layerName of Object.keys(tile.layers)) {
    const layer = tile.layers[layerName];
    layers[layerName] = {
      name: layerName,
      featureCount: layer.length,
      extent: layer.extent,
      version: layer.version,
      attributes: analyzeLayerAttributes(layer)
    };
  }
  
  return layers;
}

/**
 * Format type for display
 * @param {string[]} types - Array of type names
 * @returns {string} HTML formatted types
 */
function formatTypes(types) {
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
function formatSampleValues(values, limit, showAll) {
  const displayValues = showAll ? values : values.slice(0, limit);
  return displayValues.map(v => `${v.value} (${v.count})`).join(', ');
}

/**
 * Render results to DOM
 * @param {Object} layersData - Analysis result
 * @param {number} sampleLimit - Number of sample values to show
 * @param {boolean} showAll - Whether to show all values
 */
function renderResults(layersData, sampleLimit, showAll) {
  resultsDiv.innerHTML = '';
  
  if (Object.keys(layersData).length === 0) {
    resultsDiv.innerHTML = '<p style="padding: 20px; color: #666;">レイヤーが見つかりませんでした。</p>';
    return;
  }
  
  for (const [layerName, layerInfo] of Object.entries(layersData)) {
    const section = document.createElement('div');
    section.className = 'layer-section';
    
    const header = document.createElement('div');
    header.className = 'layer-header';
    header.innerHTML = `
      <span class="layer-name">📦 ${layerName}</span>
      <span class="layer-info">${layerInfo.featureCount} features, ${layerInfo.attributes.length} attributes</span>
    `;
    
    const content = document.createElement('div');
    content.className = 'layer-content';
    
    // Export buttons
    const exportDiv = document.createElement('div');
    exportDiv.className = 'export-buttons';
    
    const csvBtn = document.createElement('button');
    csvBtn.textContent = '📥 CSV';
    csvBtn.onclick = () => downloadCSV(layerName, layerInfo);
    
    const mdBtn = document.createElement('button');
    mdBtn.textContent = '📥 Markdown';
    mdBtn.onclick = () => downloadMarkdown(layerName, layerInfo, sampleLimit, showAll);
    
    exportDiv.appendChild(csvBtn);
    exportDiv.appendChild(mdBtn);
    content.appendChild(exportDiv);
    
    // Attributes table
    if (layerInfo.attributes.length > 0) {
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
          ${layerInfo.attributes.map(attr => `
            <tr>
              <td><strong>${attr.key}</strong></td>
              <td>${formatTypes(attr.types)}</td>
              <td>${attr.count}</td>
              <td class="sample-values">${formatSampleValues(attr.values, sampleLimit, showAll)}</td>
            </tr>
          `).join('')}
        </tbody>
      `;
      content.appendChild(table);
    } else {
      content.innerHTML += '<p style="color: #666;">属性がありません。</p>';
    }
    
    // Toggle expand/collapse
    header.onclick = () => {
      content.classList.toggle('expanded');
    };
    
    section.appendChild(header);
    section.appendChild(content);
    resultsDiv.appendChild(section);
    
    // Auto-expand first layer
    if (resultsDiv.children.length === 1) {
      content.classList.add('expanded');
    }
  }
}

/**
 * Generate CSV content for a layer
 * @param {string} layerName - Layer name
 * @param {Object} layerInfo - Layer analysis data
 * @returns {string} CSV content
 */
function generateCSV(layerName, layerInfo) {
  const lines = ['key,types,count,sample_values'];
  
  for (const attr of layerInfo.attributes) {
    const types = attr.types.join(';');
    const sampleValues = attr.values
      .slice(0, 10)
      .map(v => v.value)
      .join(';')
      .replace(/"/g, '""');
    
    lines.push(`"${attr.key}","${types}",${attr.count},"${sampleValues}"`);
  }
  
  return lines.join('\n');
}

/**
 * Generate Markdown content for a layer
 * @param {string} layerName - Layer name
 * @param {Object} layerInfo - Layer analysis data
 * @param {number} sampleLimit - Number of sample values
 * @param {boolean} showAll - Whether to show all values
 * @returns {string} Markdown content
 */
function generateMarkdown(layerName, layerInfo, sampleLimit, showAll) {
  let md = `# Layer: ${layerName}\n\n`;
  md += `- **Features**: ${layerInfo.featureCount}\n`;
  md += `- **Version**: ${layerInfo.version}\n`;
  md += `- **Extent**: ${layerInfo.extent}\n\n`;
  md += `## Attributes\n\n`;
  md += `| Key | Types | Count | Sample Values |\n`;
  md += `|-----|-------|-------|---------------|\n`;
  
  for (const attr of layerInfo.attributes) {
    const types = attr.types.join(', ');
    const samples = (showAll ? attr.values : attr.values.slice(0, sampleLimit))
      .map(v => `${v.value} (${v.count})`)
      .join(', ');
    md += `| ${attr.key} | ${types} | ${attr.count} | ${samples} |\n`;
  }
  
  return md;
}

/**
 * Download file
 * @param {string} filename - File name
 * @param {string} content - File content
 * @param {string} mimeType - MIME type
 */
function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download CSV for a layer
 * @param {string} layerName - Layer name
 * @param {Object} layerInfo - Layer analysis data
 */
function downloadCSV(layerName, layerInfo) {
  const csv = generateCSV(layerName, layerInfo);
  downloadFile(`${layerName}_attributes.csv`, csv, 'text/csv;charset=utf-8');
}

/**
 * Download Markdown for a layer
 * @param {string} layerName - Layer name
 * @param {Object} layerInfo - Layer analysis data
 * @param {number} sampleLimit - Number of sample values
 * @param {boolean} showAll - Whether to show all values
 */
function downloadMarkdown(layerName, layerInfo, sampleLimit, showAll) {
  const md = generateMarkdown(layerName, layerInfo, sampleLimit, showAll);
  downloadFile(`${layerName}_attributes.md`, md, 'text/markdown;charset=utf-8');
}

/**
 * Main fetch and analyze handler
 */
async function handleFetch() {
  const url = urlInput.value.trim();
  
  if (!url) {
    showStatus('URLを入力してください。', 'error');
    return;
  }
  
  try {
    showStatus('タイルを取得中...', 'loading');
    fetchBtn.disabled = true;
    
    const data = await fetchTile(url);
    
    showStatus('タイルを解析中...', 'loading');
    const tile = parseTile(data);
    
    currentData = analyzeTile(tile);
    
    const sampleLimit = parseInt(sampleCountInput.value) || 5;
    const showAll = showAllValuesCheckbox.checked;
    
    renderResults(currentData, sampleLimit, showAll);
    
    showStatus('解析完了!', 'success');
    setTimeout(hideStatus, 2000);
    
  } catch (error) {
    console.error('Error:', error);
    showStatus(`エラー: ${error.message}`, 'error');
  } finally {
    fetchBtn.disabled = false;
  }
}

/**
 * Handle option changes
 */
function handleOptionsChange() {
  if (currentData) {
    const sampleLimit = parseInt(sampleCountInput.value) || 5;
    const showAll = showAllValuesCheckbox.checked;
    renderResults(currentData, sampleLimit, showAll);
  }
}

// Event listeners
fetchBtn.addEventListener('click', handleFetch);
urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleFetch();
});
sampleCountInput.addEventListener('change', handleOptionsChange);
showAllValuesCheckbox.addEventListener('change', handleOptionsChange);

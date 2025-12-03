/**
 * MVT Attribute Lister - Main Application
 * Fetches and parses Mapbox Vector Tiles to display attribute information
 */

import { fetchAndAnalyzeTile } from './mvt-parser.mjs';
import { formatSampleValues, downloadCSV, downloadMarkdown } from './exporter.mjs';

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
 * Main fetch and analyze handler
 */
async function handleFetch() {
  const url = urlInput.value.trim();
  
  if (!url) {
    showStatus('URLを入力してください。', 'error');
    return;
  }
  
  try {
    showStatus('タイルを取得・解析中...', 'loading');
    fetchBtn.disabled = true;
    
    currentData = await fetchAndAnalyzeTile(url);
    
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

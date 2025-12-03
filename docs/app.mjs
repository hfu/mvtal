/**
 * MVT Attribute Lister - Main Application
 * Fetches and parses Mapbox Vector Tiles to display attribute information
 */

import { fetchAndAnalyzeTile } from './mvt-parser.mjs';
import { downloadCSV, downloadMarkdown } from './exporter.mjs';
import { getElements, showStatus, hideStatus, renderResults } from './ui.mjs';
import { CONFIG, STATUS_TYPES, MESSAGES } from './config.mjs';

// DOM Elements
const elements = getElements();

// State
let currentData = null;

/**
 * Get current sample limit from input
 * @returns {number} Sample limit value
 */
function getSampleLimit() {
  return parseInt(elements.sampleCountInput.value) || CONFIG.DEFAULT_SAMPLE_LIMIT;
}

/**
 * Get show all values setting
 * @returns {boolean} Whether to show all values
 */
function getShowAll() {
  return elements.showAllValuesCheckbox.checked;
}

/**
 * Main fetch and analyze handler
 */
async function handleFetch() {
  const url = elements.urlInput.value.trim();
  
  if (!url) {
    showStatus(elements.statusDiv, MESSAGES.ENTER_URL, STATUS_TYPES.ERROR);
    return;
  }
  
  try {
    showStatus(elements.statusDiv, MESSAGES.FETCHING, STATUS_TYPES.LOADING);
    elements.fetchBtn.disabled = true;
    
    currentData = await fetchAndAnalyzeTile(url);
    
    renderResults(
      elements.resultsDiv,
      currentData,
      getSampleLimit(),
      getShowAll(),
      downloadCSV,
      downloadMarkdown
    );
    
    showStatus(elements.statusDiv, MESSAGES.COMPLETE, STATUS_TYPES.SUCCESS);
    setTimeout(() => hideStatus(elements.statusDiv), CONFIG.STATUS_SUCCESS_TIMEOUT);
    
  } catch (error) {
    console.error('Error:', error);
    showStatus(elements.statusDiv, `${MESSAGES.ERROR_PREFIX}${error.message}`, STATUS_TYPES.ERROR);
  } finally {
    elements.fetchBtn.disabled = false;
  }
}

/**
 * Handle option changes
 */
function handleOptionsChange() {
  if (currentData) {
    renderResults(
      elements.resultsDiv,
      currentData,
      getSampleLimit(),
      getShowAll(),
      downloadCSV,
      downloadMarkdown
    );
  }
}

// Event listeners
elements.fetchBtn.addEventListener('click', handleFetch);
elements.urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleFetch();
});
elements.sampleCountInput.addEventListener('change', handleOptionsChange);
elements.showAllValuesCheckbox.addEventListener('change', handleOptionsChange);

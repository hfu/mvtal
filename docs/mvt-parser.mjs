/**
 * MVT Parser Module
 * Handles fetching and parsing of Mapbox Vector Tiles
 */

// Using pbf@4.0.1: latest stable as of 2024-06, checked for known vulnerabilities. Chosen for compatibility with @mapbox/vector-tile@2.0.3.
import Pbf from 'https://esm.sh/pbf@4.0.1';
// Using @mapbox/vector-tile@2.0.3: latest stable as of 2024-06, checked for known vulnerabilities. Chosen for compatibility with pbf@4.0.1.
import { VectorTile } from 'https://esm.sh/@mapbox/vector-tile@2.0.3';
import { VALUE_TYPES } from './config.mjs';

/**
 * Fetch MVT tile from URL
 * @param {string} url - The tile URL to fetch
 * @returns {Promise<ArrayBuffer>} The tile data as ArrayBuffer
 * @throws {Error} If the fetch fails or response is not OK
 */
export async function fetchTile(url) {
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
export function parseTile(data) {
  const pbf = new Pbf(new Uint8Array(data));
  return new VectorTile(pbf);
}

/**
 * Get the type of a value
 * @param {*} value - The value to check
 * @returns {string} The type name
 */
export function getValueType(value) {
  if (value === null || value === undefined) return VALUE_TYPES.NULL;
  if (typeof value === 'boolean') return VALUE_TYPES.BOOLEAN;
  if (typeof value === 'number') return VALUE_TYPES.NUMBER;
  if (typeof value === 'string') return VALUE_TYPES.STRING;
  return VALUE_TYPES.UNKNOWN;
}

/**
 * Analyze layer attributes
 * @param {Object} layer - The vector tile layer
 * @returns {Array} Array of attribute analysis objects
 */
export function analyzeLayerAttributes(layer) {
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
export function analyzeTile(tile) {
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
 * Fetch and analyze a tile in one operation
 * @param {string} url - The tile URL
 * @returns {Promise<Object>} Analysis result for all layers
 */
export async function fetchAndAnalyzeTile(url) {
  const data = await fetchTile(url);
  const tile = parseTile(data);
  return analyzeTile(tile);
}

/**
 * Quantity value object with units
 */
export interface Quantity {
  value: number;
  unit: string;
}

/**
 * Measurement units
 */
export interface MeasureUnit {
  id: string;
  name: string;
  abbreviation: string;
  type: 'weight' | 'volume' | 'length' | 'count';
}

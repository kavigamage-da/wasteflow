/**
 * Generates the PROPOSED WasteFlow identifiers.
 *   Trip     TR-YYYYMMDD-NNN
 *   Load     LD-YYYYMMDD-NNNNN
 *   Batch    CB-YYYYMMDD-NNN
 *   Shipment TRF-YYYYMMDD-NNN
 */
function stamp(date = new Date()): string {
  const y = date.getUTCFullYear().toString().padStart(4, '0');
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = date.getUTCDate().toString().padStart(2, '0');
  return `${y}${m}${d}`;
}

export const ids = {
  today: () => stamp(),
  trip: (seq: number) => `TR-${stamp()}-${String(seq).padStart(3, '0')}`,
  load: (seq: number) => `LD-${stamp()}-${String(seq).padStart(5, '0')}`,
  compostBatch: (seq: number) => `CB-${stamp()}-${String(seq).padStart(3, '0')}`,
  shipment: (seq: number) => `TRF-${stamp()}-${String(seq).padStart(3, '0')}`
};

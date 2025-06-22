// Document Number Generator for eQMS
// Generates unique document numbers based on type and sequence

interface DocumentType {
  id: number;
  name: string;
  prefix: string;
  categoryId: number;
}

let documentCounter = 1000; // Starting sequence number

export function generateDocumentNumber(typePrefix?: string): string {
  const year = new Date().getFullYear();
  const prefix = typePrefix || 'DOC';
  const sequence = String(documentCounter++).padStart(4, '0');
  
  return `${prefix}-${year}-${sequence}`;
}

export function resetCounter(start: number = 1000): void {
  documentCounter = start;
}

export function getNextSequence(): number {
  return documentCounter;
}
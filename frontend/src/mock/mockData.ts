export const SIMULATE_LIVE = false;

export type OrderStatus = 'PENDING' | 'MATCHING' | 'NEGOTIATING' | 'BOOKED' | 'IN_TRANSIT' | 'DELIVERED' | 'AUDIT_FAILED';

export interface Load {
  id: string;
  origin: string;
  destination: string;
  weightKg: number;
  targetRate: number;
  status: OrderStatus;
  carrierName?: string;
  eta?: string;
  lat?: number;
  lng?: number;
}

export const mockLoads: Load[] = [
  { id: 'LD-9901', origin: 'Berlin, DE', destination: 'Munich, DE', weightKg: 24000, targetRate: 850, status: 'IN_TRANSIT', carrierName: 'Alpha Logistics', eta: '2026-09-28T18:00:00Z', lat: 49.0, lng: 11.5 },
  { id: 'LD-9902', origin: 'Paris, FR', destination: 'Lyon, FR', weightKg: 12000, targetRate: 450, status: 'BOOKED', carrierName: 'FastTrans', eta: '2026-09-29T10:00:00Z' },
  { id: 'LD-9903', origin: 'Madrid, ES', destination: 'Barcelona, ES', weightKg: 22000, targetRate: 600, status: 'NEGOTIATING' },
  { id: 'LD-9904', origin: 'Rome, IT', destination: 'Milan, IT', weightKg: 18000, targetRate: 550, status: 'DELIVERED', carrierName: 'ItalCargo', eta: '2026-09-27T14:30:00Z', lat: 45.4642, lng: 9.1900 },
  { id: 'LD-9905', origin: 'Amsterdam, NL', destination: 'Rotterdam, NL', weightKg: 5000, targetRate: 200, status: 'MATCHING' },
  { id: 'LD-9906', origin: 'Vienna, AT', destination: 'Salzburg, AT', weightKg: 19000, targetRate: 400, status: 'IN_TRANSIT', carrierName: 'Alpine Haul', eta: '2026-09-28T19:45:00Z', lat: 47.9, lng: 13.5 },
  { id: 'LD-9907', origin: 'Warsaw, PL', destination: 'Krakow, PL', weightKg: 24000, targetRate: 500, status: 'PENDING' },
  { id: 'LD-9908', origin: 'Prague, CZ', destination: 'Brno, CZ', weightKg: 15000, targetRate: 350, status: 'AUDIT_FAILED', carrierName: 'CZ Freight' },
  { id: 'LD-9909', origin: 'Brussels, BE', destination: 'Antwerp, BE', weightKg: 8000, targetRate: 150, status: 'IN_TRANSIT', carrierName: 'Benelux Transport', eta: '2026-09-28T17:15:00Z', lat: 51.1, lng: 4.4 },
  { id: 'LD-9910', origin: 'Copenhagen, DK', destination: 'Aarhus, DK', weightKg: 21000, targetRate: 700, status: 'BOOKED', carrierName: 'Nordic Carriers' },
  { id: 'LD-9911', origin: 'Stockholm, SE', destination: 'Gothenburg, SE', weightKg: 24000, targetRate: 900, status: 'NEGOTIATING' },
  { id: 'LD-9912', origin: 'Oslo, NO', destination: 'Bergen, NO', weightKg: 10000, targetRate: 600, status: 'DELIVERED', carrierName: 'Fjord Trans' }
];

export interface Event {
  id: string;
  loadId: string;
  type: string;
  message: string;
  timestamp: string;
}

export const mockEvents: Event[] = [
  { id: 'EV-1', loadId: 'LD-9901', type: 'DELAY', message: 'Delay detected due to heavy traffic.', timestamp: '2026-09-28T15:30:00Z' },
  { id: 'EV-2', loadId: 'LD-9902', type: 'BOOKED', message: 'Booking confirmed with FastTrans.', timestamp: '2026-09-28T14:45:00Z' },
  { id: 'EV-3', loadId: 'LD-9908', type: 'AUDIT_FAILED', message: 'Invoice mismatch detected. AI Audit failed.', timestamp: '2026-09-28T14:00:00Z' },
  { id: 'EV-4', loadId: 'LD-9906', type: 'ROUTE_OPTIMIZED', message: 'Route optimized to save 15 mins.', timestamp: '2026-09-28T13:15:00Z' },
  { id: 'EV-5', loadId: 'LD-9904', type: 'DELIVERED', message: 'Load successfully delivered in Milan.', timestamp: '2026-09-27T14:35:00Z' },
  { id: 'EV-6', loadId: 'LD-9912', type: 'INVOICE_PROCESSED', message: 'Invoice automatically processed.', timestamp: '2026-09-27T12:00:00Z' },
  { id: 'EV-7', loadId: 'LD-9903', type: 'NEGOTIATION', message: 'AI Agent started negotiation for Madrid route.', timestamp: '2026-09-28T16:10:00Z' },
  { id: 'EV-8', loadId: 'LD-9910', type: 'BOOKED', message: 'Carrier assigned: Nordic Carriers.', timestamp: '2026-09-28T11:20:00Z' }
];

export interface NegotiationTurn {
  speaker: 'AI_AGENT' | 'CARRIER';
  message: string;
  proposedRate?: number;
}

export interface Negotiation {
  id: string;
  loadId: string;
  carrierName: string;
  turns: NegotiationTurn[];
  finalRate: number | null;
  status: 'IN_PROGRESS' | 'AGREED' | 'FAILED';
}

export const mockNegotiations: Negotiation[] = [
  {
    id: 'NEG-1',
    loadId: 'LD-9903',
    carrierName: 'Iberia Freight',
    status: 'IN_PROGRESS',
    finalRate: null,
    turns: [
      { speaker: 'AI_AGENT', message: 'Hello, we have a load from Madrid to Barcelona. Target rate is €600.', proposedRate: 600 },
      { speaker: 'CARRIER', message: 'I can do it for €750.', proposedRate: 750 },
      { speaker: 'AI_AGENT', message: 'That is above our limit. Can we agree on €650?', proposedRate: 650 },
      { speaker: 'CARRIER', message: 'Make it €680 and I will book it now.', proposedRate: 680 }
    ]
  },
  {
    id: 'NEG-2',
    loadId: 'LD-9902',
    carrierName: 'FastTrans',
    status: 'AGREED',
    finalRate: 460,
    turns: [
      { speaker: 'AI_AGENT', message: 'Hello, load from Paris to Lyon available. Target is €450.', proposedRate: 450 },
      { speaker: 'CARRIER', message: '€480 and it\'s yours.', proposedRate: 480 },
      { speaker: 'AI_AGENT', message: 'I can authorize €460 right now.', proposedRate: 460 },
      { speaker: 'CARRIER', message: 'Agreed. Booking confirmed.', proposedRate: 460 }
    ]
  },
  {
    id: 'NEG-3',
    loadId: 'LD-9911',
    carrierName: 'Svensk Haul',
    status: 'IN_PROGRESS',
    finalRate: null,
    turns: [
      { speaker: 'AI_AGENT', message: 'Load Stockholm to Gothenburg, target €900.', proposedRate: 900 },
      { speaker: 'CARRIER', message: 'I need €1100 for that weight.', proposedRate: 1100 }
    ]
  }
];

export interface Invoice {
  id: string;
  loadId: string;
  carrierName: string;
  negotiatedRate: number;
  billedAmount: number;
  auditStatus: 'PASS' | 'FAIL' | 'PENDING';
  discrepancies: string[];
}

export const mockInvoices: Invoice[] = [
  { id: 'INV-001', loadId: 'LD-9904', carrierName: 'ItalCargo', negotiatedRate: 550, billedAmount: 550, auditStatus: 'PASS', discrepancies: [] },
  { id: 'INV-002', loadId: 'LD-9908', carrierName: 'CZ Freight', negotiatedRate: 350, billedAmount: 420, auditStatus: 'FAIL', discrepancies: ['Accessorial charge: Wait time (Not approved)'] },
  { id: 'INV-003', loadId: 'LD-9912', carrierName: 'Fjord Trans', negotiatedRate: 600, billedAmount: 600, auditStatus: 'PASS', discrepancies: [] },
  { id: 'INV-004', loadId: 'LD-9901', carrierName: 'Alpha Logistics', negotiatedRate: 850, billedAmount: 900, auditStatus: 'FAIL', discrepancies: ['Fuel surcharge mismatch'] },
  { id: 'INV-005', loadId: 'LD-9902', carrierName: 'FastTrans', negotiatedRate: 460, billedAmount: 0, auditStatus: 'PENDING', discrepancies: [] }
];

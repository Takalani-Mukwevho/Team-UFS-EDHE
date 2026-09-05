// Custom hook for fetching and caching API data
// Provides loading states, error handling, and automatic data transformation

import { useState, useEffect, useCallback } from 'react';
import {
  getInvoices,
  getBuyers,
  getSmes,
  transformInvoiceForUI,
  transformBuyerForUI,
} from './api.js';
import { applyLedgerOverlay } from './ledgerBridge.js';

/**
 * Hook to fetch and manage all dashboard data from the API.
 * Falls back to mock data if the API is unavailable.
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.useMockFallback - Use mock data if API fails (default: true)
 * @param {boolean} options.autoFetch - Fetch data on mount (default: true)
 * @returns {Object} { invoices, buyers, smes, loading, error, refetch }
 */
export function useApiData({ useMockFallback = true, autoFetch = true } = {}) {
  const [invoices, setInvoices] = useState([]);
  const [buyers, setBuyers] = useState({});
  const [smes, setSmes] = useState({});
  const [loading, setLoading] = useState(autoFetch); // start true if auto-fetching
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('none'); // 'api', 'mock', 'none'

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [apiInvoices, apiBuyers, apiSmes] = await Promise.all([
        getInvoices().catch(() => []),
        getBuyers().catch(() => []),
        getSmes().catch(() => []),
      ]);

      // Transform buyers into a lookup map (keyed by company name for compatibility)
      const buyersMap = {};
      apiBuyers.forEach(b => {
        const transformed = transformBuyerForUI(b);
        if (transformed) {
          buyersMap[b.companyName] = transformed;
        }
      });

      // Transform SMEs into a lookup map
      const smesMap = {};
      apiSmes.forEach(s => {
        smesMap[s.smeId] = s;
      });

      // Transform invoices to UI format
      const transformedInvoices = apiInvoices.map(inv => {
        const buyer = apiBuyers.find(b => b.buyerId === inv.buyerId);
        const sme = apiSmes.find(s => s.smeId === inv.smeId);
        return transformInvoiceForUI(inv, buyer, sme);
      }).filter(Boolean);

      setInvoices(applyLedgerOverlay(transformedInvoices.length > 0 ? transformedInvoices : getMockInvoices()));
      setBuyers(Object.keys(buyersMap).length > 0 ? buyersMap : getMockBuyers());
      setSmes(Object.keys(smesMap).length > 0 ? smesMap : getMockSmes());
      setDataSource(transformedInvoices.length > 0 ? 'api' : 'mock');
    } catch (err) {
      console.warn('API fetch failed, using mock data:', err.message);
      if (useMockFallback) {
        setInvoices(applyLedgerOverlay(getMockInvoices()));
        setBuyers(getMockBuyers());
        setSmes(getMockSmes());
        setDataSource('mock');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [useMockFallback]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return {
    invoices,
    buyers,
    smes,
    loading,
    error,
    dataSource,
    refetch: fetchData,
  };
}

// =============================================================================
// MOCK DATA FALLBACKS
// These match the original mock data in src/data/ files
// =============================================================================

function getMockInvoices() {
  return [
    {
      id: 'c1', sme: 'ABC Construction (Pty) Ltd', smeVerified: true, buyer: 'XYZ Corporation',
      status: 'awaiting', submitted: '07:42',
      fields: { invoiceNumber: 'INV-1042', amount: 185000, issueDate: '01/09/2026', dueDate: '31/10/2026', termsDays: 60 },
      confidence: { invoiceNumber: 99.4, supplier: 98.8, buyer: 99.1, amount: 99.7, issueDate: 97.2, dueDate: 97.6, termsDays: 95.4 },
      checksPass: true,
    },
    {
      id: 'c2', sme: 'ABC Construction (Pty) Ltd', smeVerified: true, buyer: 'ABC Holdings',
      status: 'awaiting', submitted: '08:03',
      fields: { invoiceNumber: 'INV-2087', amount: 420000, issueDate: '12/08/2026', dueDate: '11/10/2026', termsDays: 60 },
      confidence: { invoiceNumber: 98.9, supplier: 98.4, buyer: 97.8, amount: 99.5, issueDate: 96.9, dueDate: 97.1, termsDays: 94.8 },
      checksPass: true,
    },
    {
      id: 'c3', sme: 'Motsepe Logistics CC', smeVerified: true, buyer: 'Highveld Mining Supplies',
      status: 'awaiting', submitted: '08:19',
      fields: { invoiceNumber: 'INV-3310', amount: 96400, issueDate: '26/08/2026', dueDate: '25/10/2026', termsDays: 60 },
      confidence: { invoiceNumber: 99.1, supplier: 97.9, buyer: 98.6, amount: 99.4, issueDate: 96.4, dueDate: 96.8, termsDays: 93.2 },
      checksPass: true,
    },
    {
      id: 'c4', sme: 'Kgosi Electrical (Pty) Ltd', smeVerified: true, buyer: 'Meridian Foods',
      status: 'awaiting', submitted: '08:31',
      fields: { invoiceNumber: 'INV-5521', amount: 268750, issueDate: '20/08/2026', dueDate: '19/10/2026', termsDays: 60 },
      confidence: { invoiceNumber: 98.2, supplier: 96.1, buyer: 91.4, amount: 99.2, issueDate: 88.7, dueDate: 95.9, termsDays: 92.6 },
      checksPass: true,
    },
    {
      id: 'c5', sme: 'Vuka Facilities Services', smeVerified: true, buyer: 'Cape Union Freight',
      status: 'awaiting', submitted: '08:47',
      fields: { invoiceNumber: 'INV-7043', amount: 142300, issueDate: '18/08/2026', dueDate: '17/10/2026', termsDays: 60 },
      confidence: { invoiceNumber: 99.0, supplier: 98.2, buyer: 97.4, amount: 99.6, issueDate: 96.1, dueDate: 96.5, termsDays: 94.1 },
      checksPass: true,
    },
    {
      id: 'c6', sme: 'Thandi Textiles', smeVerified: false, buyer: 'Nkosi Retail Group',
      status: 'awaiting', submitted: '09:02',
      fields: { invoiceNumber: 'INV-8890', amount: 58900, issueDate: '29/08/2026', dueDate: '28/10/2026', termsDays: 60 },
      confidence: { invoiceNumber: 97.6, supplier: 89.3, buyer: 96.8, amount: 99.1, issueDate: 94.2, dueDate: 94.6, termsDays: 90.4 },
      checksPass: true,
    },
    {
      id: 'c7', sme: 'ABC Construction (Pty) Ltd', smeVerified: true, buyer: 'XYZ Corporation',
      status: 'blocked', submitted: '09:11',
      fields: { invoiceNumber: 'INV-1042', amount: 185000, issueDate: '01/09/2026', dueDate: '31/10/2026', termsDays: 60 },
      confidence: { invoiceNumber: 99.4, supplier: 98.8, buyer: 99.1, amount: 99.7, issueDate: 97.2, dueDate: 97.6, termsDays: 95.4 },
      checksPass: false, dupNote: 'matches ledger entry 07:42',
    },
  ];
}

function getMockBuyers() {
  return {
    'XYZ Corporation': { historicalInvoices: 142, onTimeRate: 0.96, avgSettlementDays: 28, sector: 'Property development', recent: [24,31,26,29,22,35,27,30,25,28,64,26] },
    'Highveld Mining Supplies': { historicalInvoices: 87, onTimeRate: 0.91, avgSettlementDays: 34, sector: 'Mining services', recent: [30,38,33,29,41,36,31,35,62,34,32,37] },
    'Nkosi Retail Group': { historicalInvoices: 61, onTimeRate: 0.86, avgSettlementDays: 41, sector: 'Retail', recent: [38,45,52,36,44,61,40,39,47,66,42,43] },
    'Meridian Foods': { historicalInvoices: 54, onTimeRate: 0.79, avgSettlementDays: 52, sector: 'Food manufacturing', recent: [48,57,63,45,71,52,49,58,44,68,55,50] },
    'Cape Union Freight': { historicalInvoices: 43, onTimeRate: 0.71, avgSettlementDays: 58, sector: 'Logistics', recent: [55,72,49,64,81,57,60,53,77,62,58,66] },
    'ABC Holdings': { historicalInvoices: 38, onTimeRate: 0.64, avgSettlementDays: 71, sector: 'Civil construction', recent: [68,84,59,92,73,66,101,70,58,88,76,79] },
  };
}

function getMockSmes() {
  return {
    'sme-001': { companyName: 'Precision Engineering', industry: 'Manufacturing', isVerified: true },
    'sme-002': { companyName: 'Cape Digital Solutions', industry: 'Technology', isVerified: true },
    'sme-003': { companyName: 'Pretoria Logistics', industry: 'Transport & Logistics', isVerified: true },
    'sme-004': { companyName: 'Durban Supplies Co', industry: 'Wholesale', isVerified: true },
    'sme-005': { companyName: 'Free State Services', industry: 'Professional Services', isVerified: false },
  };
}

export default useApiData;

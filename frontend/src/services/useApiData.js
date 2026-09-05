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

      setInvoices(transformedInvoices);
      setBuyers(buyersMap);
      setSmes(smesMap);
      setDataSource('api');
    } catch (err) {
      console.warn('API fetch failed, using mock data:', err.message);
      setInvoices([]);
      setBuyers({});
      setSmes({});
      setDataSource('none');
      setError(err.message);
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



export default useApiData;

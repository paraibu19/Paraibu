import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { BarChart3, Calculator, FileText, Calendar, Clock, X, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface AnalyticsEvent {
  id: string;
  type: 'CALCULATION' | 'PDF_DOWNLOAD' | 'CALENDAR_EXPORT';
  timestamp: Timestamp;
  language?: string;
  weight?: number;
  medications?: string[];
  patientName?: string;
}

export default function StatsDashboard({ onClose }: { onClose: () => void }) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCalcs: 0,
    totalPdfs: 0,
    totalCalendars: 0,
    uniqueDays: 0,
    reach: 0, // Total interactions with provided patient names
    pdfsEn: 0,
    pdfsAr: 0
  });

  const fetchEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const q = query(collection(db, 'analytics_events'), orderBy('timestamp', 'desc'), limit(500));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setEvents([]);
        setStats({ 
          totalCalcs: 0, 
          totalPdfs: 0, 
          totalCalendars: 0,
          uniqueDays: 0, 
          reach: 0,
          pdfsEn: 0,
          pdfsAr: 0
        });
        return;
      }

      const fetchedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AnalyticsEvent[];

      setEvents(fetchedEvents);

      // Aggregations
      const calcs = fetchedEvents.filter(e => e.type === 'CALCULATION').length;
      const pdfs = fetchedEvents.filter(e => e.type === 'PDF_DOWNLOAD');
      const calendars = fetchedEvents.filter(e => e.type === 'CALENDAR_EXPORT').length;
      
      const pdfsEn = pdfs.filter(e => e.language === 'en').length;
      const pdfsAr = pdfs.filter(e => e.language === 'ar').length;
      const reachCount = fetchedEvents.filter(e => e.patientName === 'Provided').length;

      const uniqueDaysSet = new Set(fetchedEvents.map(e => {
        try {
          return e.timestamp ? format(e.timestamp.toDate(), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        } catch {
          return format(new Date(), 'yyyy-MM-dd');
        }
      }));
      
      setStats({
        totalCalcs: calcs,
        totalPdfs: pdfs.length,
        totalCalendars: calendars,
        totalReports: pdfs.length + calendars, // Total document/export activity
        uniqueDays: uniqueDaysSet.size,
        reach: reachCount,
        pdfsEn,
        pdfsAr
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Could not load statistics. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col font-sans"
      >
        {/* Header content ... */}
        <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">Insights Dashboard</h2>
              <p className="text-xs md:text-sm text-gray-500 font-medium">Platform activity metrics</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => fetchEvents(true)}
              disabled={refreshing || loading}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors text-gray-400"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-gray-50/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
              <p className="text-sm font-medium text-gray-500">Syncing encrypted data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <p className="text-gray-900 font-bold">{error}</p>
              <button 
                onClick={() => fetchEvents()}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No activity data found.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Primary Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* CALCULATIONS */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <Calculator className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</span>
                  </div>
                  <div className="text-5xl font-black text-gray-900 tracking-tighter">{stats.totalCalcs}</div>
                  <p className="text-xs font-black text-gray-500 mt-2 uppercase">Calculations</p>
                </div>

                {/* REPORTS */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Combined</span>
                  </div>
                  <div className="text-5xl font-black text-gray-900 tracking-tighter">{stats.totalReports}</div>
                  <p className="text-xs font-black text-gray-500 mt-2 uppercase">Reports</p>
                </div>

                {/* PDF GENERATIONS */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Documents</span>
                  </div>
                  <div className="text-5xl font-black text-gray-900 tracking-tighter">{stats.totalPdfs}</div>
                  <p className="text-xs font-black text-gray-500 mt-2 uppercase">PDF Generations</p>
                </div>

                {/* REACH */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                      <Clock className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Impact</span>
                  </div>
                  <div className="text-5xl font-black text-gray-900 tracking-tighter">{stats.reach}</div>
                  <p className="text-xs font-black text-gray-500 mt-2 uppercase">Reach</p>
                </div>

                {/* UNIQUE DAYS */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active</span>
                  </div>
                  <div className="text-5xl font-black text-gray-900 tracking-tighter">{stats.uniqueDays}</div>
                  <p className="text-xs font-black text-gray-500 mt-2 uppercase">Unique Days</p>
                </div>

                {/* Recent Activity Mini Chart / Info */}
                <div className="col-span-1 sm:col-span-2 lg:col-span-1 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Export Analysis</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-bold text-gray-600">PDF Exported EN</span>
                      <span className="text-lg font-black text-gray-900">{stats.pdfsEn}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <span className="text-sm font-bold text-gray-600">PDF Exported AR</span>
                      <span className="text-lg font-black text-gray-900">{stats.pdfsAr}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) }
        </div>
      </motion.div>
    </motion.div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { BarChart3, Calculator, FileText, Calendar, Clock, X, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface AnalyticsEvent {
  id: string;
  type: 'CALCULATION' | 'PDF_DOWNLOAD';
  timestamp: Timestamp;
  language?: string;
  weight?: number;
  medications?: string[];
}

export default function StatsDashboard({ onClose }: { onClose: () => void }) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCalcs: 0,
    totalPdfs: 0,
    uniqueDays: 0
  });

  const fetchEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const q = query(collection(db, 'analytics_events'), orderBy('timestamp', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setEvents([]);
        setStats({ totalCalcs: 0, totalPdfs: 0, uniqueDays: 0 });
        return;
      }

      const fetchedEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AnalyticsEvent[];

      setEvents(fetchedEvents);

      // Basic aggregation
      const calcs = fetchedEvents.filter(e => e.type === 'CALCULATION').length;
      const pdfs = fetchedEvents.filter(e => e.type === 'PDF_DOWNLOAD').length;
      
      setStats({
        totalCalcs: calcs,
        totalPdfs: pdfs,
        uniqueDays: new Set(fetchedEvents.map(e => {
          try {
            return format(e.timestamp.toDate(), 'yyyy-MM-dd');
          } catch {
            return format(new Date(), 'yyyy-MM-dd');
          }
        })).size
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
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">Usage Insights</h2>
              <p className="text-xs md:text-sm text-gray-500">Real-time anonymous activity</p>
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

        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
              <p className="text-sm font-medium text-gray-500">Loading statistics...</p>
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
              <p className="text-gray-500 font-medium">No activity recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50">
                  <div className="flex items-center justify-between mb-4">
                    <Calculator className="w-5 h-5 text-blue-600" />
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Calculations</span>
                  </div>
                  <div className="text-4xl font-black text-blue-900 leading-none">{stats.totalCalcs}</div>
                  <p className="text-[10px] font-bold text-blue-400 mt-3 uppercase tracking-tighter">Recent activity</p>
                </div>

                <div className="bg-purple-50/50 p-6 rounded-3xl border border-purple-100/50">
                  <div className="flex items-center justify-between mb-4">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">Reports</span>
                  </div>
                  <div className="text-4xl font-black text-purple-900 leading-none">{stats.totalPdfs}</div>
                  <p className="text-[10px] font-bold text-purple-400 mt-3 uppercase tracking-tighter">PDF Generations</p>
                </div>

                <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/50">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Reach</span>
                  </div>
                  <div className="text-4xl font-black text-emerald-900 leading-none">{stats.uniqueDays}</div>
                  <p className="text-[10px] font-bold text-emerald-400 mt-3 uppercase tracking-tighter">Unique Days</p>
                </div>
              </div>

              {/* Recent Activity Log */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Showing last {events.length}</span>
                </div>
                <div className="grid gap-3">
                  {events.map((event) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={event.id}
                      className="flex items-center p-4 bg-white rounded-2xl border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all group"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
                        event.type === 'CALCULATION' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {event.type === 'CALCULATION' ? <Calculator className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-gray-900">
                            {event.type === 'CALCULATION' ? 'Dose Calculated' : 'PDF Exported'}
                          </span>
                          <span className="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded-md uppercase font-black text-gray-500">
                            {event.language || '??'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-[11px] text-gray-400 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>{event.timestamp ? format(event.timestamp.toDate(), 'MMM d, HH:mm') : 'Just now'}</span>
                          {event.weight && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-gray-200" />
                              <span>{event.weight}kg</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="hidden sm:flex space-x-1">
                        {event.medications?.slice(0, 2).map((m, i) => (
                          <div key={i} className="text-[9px] bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg text-gray-500 font-bold whitespace-nowrap">
                            {m.split(' (')[0]}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

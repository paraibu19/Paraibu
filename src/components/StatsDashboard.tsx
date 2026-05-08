import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { BarChart3, Calculator, FileText, Calendar, Clock, X, ChevronRight } from 'lucide-react';
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
  const [stats, setStats] = useState({
    totalCalcs: 0,
    totalPdfs: 0,
    uniqueDays: 0
  });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, 'analytics_events'), orderBy('timestamp', 'desc'), limit(100));
        const snapshot = await getDocs(q);
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
          uniqueDays: new Set(fetchedEvents.map(e => format(e.timestamp.toDate(), 'yyyy-MM-dd'))).size
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

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
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">App Usage Insights</h2>
              <p className="text-sm text-gray-500">Anonymous activity tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                  <div className="flex items-center justify-between mb-4">
                    <Calculator className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Calculations</span>
                  </div>
                  <div className="text-4xl font-black text-blue-900">{stats.totalCalcs}</div>
                  <p className="text-xs font-medium text-blue-500 mt-2">Historical (Last 100)</p>
                </div>

                <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100">
                  <div className="flex items-center justify-between mb-4">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">PDF Reports</span>
                  </div>
                  <div className="text-4xl font-black text-purple-900">{stats.totalPdfs}</div>
                  <p className="text-xs font-medium text-purple-500 mt-2">Downloads triggered</p>
                </div>

                <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Active Days</span>
                  </div>
                  <div className="text-4xl font-black text-green-900">{stats.uniqueDays}</div>
                  <p className="text-xs font-medium text-green-500 mt-2">Unique dates seen</p>
                </div>
              </div>

              {/* Recent Activity Log */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 px-2">Recent Activity</h3>
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-lg hover:shadow-gray-100 transition-all"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        event.type === 'CALCULATION' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                      }`}>
                        {event.type === 'CALCULATION' ? <Calculator className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-gray-900">
                            {event.type === 'CALCULATION' ? 'Dose Calculated' : 'PDF Downloaded'}
                          </span>
                          <span className="text-[10px] bg-gray-200 px-1.5 py-0.5 rounded uppercase font-bold text-gray-600">
                            {event.language}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-400 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>{format(event.timestamp.toDate(), 'MMM d, HH:mm')}</span>
                          {event.weight && (
                            <>
                              <span className="mx-1">•</span>
                              <span>Weight: {event.weight}kg</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="hidden sm:block">
                         <div className="flex -space-x-1">
                           {event.medications?.map((m, i) => (
                             <div key={i} className="text-[10px] bg-white border border-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-bold whitespace-nowrap shadow-sm">
                               {m.split(' (')[0]}
                             </div>
                           ))}
                         </div>
                      </div>
                    </div>
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

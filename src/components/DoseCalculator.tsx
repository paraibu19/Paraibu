import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, addHours } from 'date-fns';
import { Calculator, Mail, FileText, AlertCircle, CheckCircle2, Loader2, ChevronRight, History, Scale, Droplets } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { MedicationType, ScheduleItem, FormData } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';

const PARACETAMOL_CONCENTRATIONS = [
  { label: '120mg/5ml', value: '120mg/5ml' },
  { label: '150mg/5ml', value: '150mg/5ml' },
  { label: '200mg/5ml', value: '200mg/5ml' },
  { label: '240mg/5ml', value: '240mg/5ml' },
  { label: '100mg/1ml', value: '100mg/1ml' },
];

const IBUPROFEN_CONCENTRATIONS = [
  { label: '100mg/5ml', value: '100mg/5ml' },
  { label: '40mg/1ml', value: '40mg/1ml' },
];

export default function DoseCalculator() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    weight: 0,
    previousMedication: 'None',
    paracetamolConcentration: '120mg/5ml',
    ibuprofenConcentration: '100mg/5ml',
  });

  const [results, setResults] = useState<{
    paracetamolDose: number;
    ibuprofenDose: number;
    schedule: ScheduleItem[];
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const calculateDoses = (weight: number) => {
    const Y = weight;
    // Paracetamol Rules
    const A = Number((((75 * Y) / 6) / 24).toFixed(2));
    const B = Number((((75 * Y) / 6) / 30).toFixed(2));
    const C = Number((((75 * Y) / 6) / 40).toFixed(2));
    const D = Number((((75 * Y) / 6) / 48).toFixed(2));
    const E = Number((((75 * Y) / 6) / 100).toFixed(2));

    // Ibuprofen Rules
    const F = Number((((40 * Y) / 3) / 20).toFixed(2));
    const G = Number((((75 * Y) / 3) / 40).toFixed(2));

    return { A, B, C, D, E, F, G };
  };

  const getSelectedDoses = () => {
    const { A, B, C, D, E, F, G } = calculateDoses(formData.weight);
    
    let pDose = 0;
    switch (formData.paracetamolConcentration) {
      case '120mg/5ml': pDose = A; break;
      case '150mg/5ml': pDose = B; break;
      case '200mg/5ml': pDose = C; break;
      case '240mg/5ml': pDose = D; break;
      case '100mg/1ml': pDose = E; break;
    }

    let iDose = 0;
    switch (formData.ibuprofenConcentration) {
      case '100mg/5ml': iDose = F; break;
      case '40mg/1ml': iDose = G; break;
    }

    return { pDose, iDose };
  };

  const generateSchedule = (now: Date, pDose: number, iDose: number): ScheduleItem[] => {
    const schedule: ScheduleItem[] = [];
    const P = formData.previousMedication;
    const T = now;

    if (P === 'Ibuprofen') {
      schedule.push({ time: addHours(T, 2), medication: 'Paracetamol', dose: pDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 6), medication: 'Paracetamol', dose: pDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 10), medication: 'Paracetamol', dose: pDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 8), medication: 'Ibuprofen', dose: iDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 14), medication: 'Paracetamol', dose: pDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 18), medication: 'Paracetamol', dose: pDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 16), medication: 'Ibuprofen', dose: iDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 22), medication: 'Paracetamol', dose: pDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 24), medication: 'Ibuprofen', dose: iDose, unit: 'mL' });
    } else if (P === 'Paracetamol') {
      schedule.push({ time: addHours(T, 2), medication: 'Ibuprofen', dose: iDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 4), medication: 'Paracetamol', dose: pDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 8), medication: 'Paracetamol', dose: pDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 10), medication: 'Ibuprofen', dose: iDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 12), medication: 'Paracetamol', dose: pDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 16), medication: 'Paracetamol', dose: pDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 18), medication: 'Ibuprofen', dose: iDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 20), medication: 'Paracetamol', dose: pDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 24), medication: 'Paracetamol', dose: pDose, unit: 'mL' });
    } else {
      // Start immediately with Paracetamol as default if None
      schedule.push({ time: T, medication: 'Paracetamol', dose: pDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 4), medication: 'Paracetamol', dose: pDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 8), medication: 'Paracetamol', dose: pDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 12), medication: 'Paracetamol', dose: pDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 6), medication: 'Ibuprofen', dose: iDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 12), medication: 'Ibuprofen', dose: iDose, unit: 'mL' });
      schedule.push({ time: addHours(T, 18), medication: 'Ibuprofen', dose: iDose, unit: 'mL' });
    }

    return schedule.sort((a, b) => a.time.getTime() - b.time.getTime());
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const { pDose, iDose } = getSelectedDoses();
    const schedule = generateSchedule(new Date(), pDose, iDose);
    setResults({ paracetamolDose: pDose, ibuprofenDose: iDose, schedule });
    setStatus(null);
  };

  const generatePDF = () => {
    if (!results) return null;

    const doc = new jsPDF();
    const now = new Date();
    const timestamp = format(now, 'yyyy-MM-dd HH:mm:ss');

    // Header
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185);
    doc.text('Paraibu Dose Calculation', 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Submitted on: ${timestamp}`, 105, 30, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Dear ${formData.email},`, 20, 45);
    doc.text(`Patient weight: ${formData.weight} kg`, 20, 55);

    // Medications
    doc.setDrawColor(200);
    doc.line(20, 65, 190, 65);
    doc.setFontSize(16);
    doc.text('Selected Medications:', 20, 75);

    doc.setFontSize(12);
    doc.text(`Paracetamol: ${formData.paracetamolConcentration} -> Dose: ${results.paracetamolDose} mL`, 25, 85);
    doc.text(`Ibuprofen: ${formData.ibuprofenConcentration} -> Dose: ${results.ibuprofenDose} mL`, 25, 95);

    doc.line(20, 105, 190, 105);

    // Schedule
    doc.setFontSize(16);
    doc.text('Medication Schedule:', 20, 115);

    const tableData = results.schedule.map(item => [
      format(item.time, 'HH:mm'),
      item.medication,
      `${item.dose} ${item.unit}`
    ]);

    autoTable(doc, {
      startY: 120,
      head: [['Time', 'Medication', 'Dose']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Safety Notice
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(16);
    doc.text('Safety Notice:', 20, finalY);
    doc.setFontSize(10);
    doc.setTextColor(150, 0, 0);
    const notices = [
      '- Always use a proper measuring syringe',
      '- Do not exceed maximum daily doses',
      '- Do not give Paracetamol more frequently than every 4 hours',
      '- Do not give Ibuprofen more frequently than every 6 hours'
    ];
    notices.forEach((notice, index) => {
      doc.text(notice, 25, finalY + 10 + (index * 7));
    });

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Copyright 2019 | Contact: paraibu19@gmail.com', 105, pageHeight - 10, { align: 'center' });

    return doc;
  };

  const handleDownloadPDF = () => {
    if (!results) return;
    setIsSubmitting(true);
    setStatus(null);

    try {
      const doc = generatePDF();
      if (!doc) throw new Error('Failed to generate PDF');
      
      doc.save('Paraibu_Dose_Calculation.pdf');
      setStatus({ type: 'success', message: 'PDF downloaded successfully!' });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Failed to generate PDF. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <header className="text-center space-y-2">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 mb-4"
        >
          <Calculator className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Paraibu Dose Calculation</h1>
        <p className="text-gray-500 max-w-md mx-auto">Professional pediatric medication dose calculation assistant.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Section */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-6 md:p-8 space-y-6"
        >
          <form onSubmit={handleCalculate} className="space-y-6">
            <div className="space-y-4">
              <label className="block">
                <span className="flex items-center text-sm font-semibold text-gray-700 mb-1.5">
                  <Mail className="w-4 h-4 mr-2 text-blue-500" />
                  Patient Email
                </span>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="parent@example.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </label>

              <label className="block">
                <span className="flex items-center text-sm font-semibold text-gray-700 mb-1.5">
                  <Scale className="w-4 h-4 mr-2 text-blue-500" />
                  Patient Weight (kg)
                </span>
                <input
                  type="number"
                  step="0.1"
                  required
                  min="1"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder="Enter weight in kg"
                  value={formData.weight || ''}
                  onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                />
              </label>

              <label className="block">
                <span className="flex items-center text-sm font-semibold text-gray-700 mb-1.5">
                  <History className="w-4 h-4 mr-2 text-blue-500" />
                  Previous Medication Taken
                </span>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none bg-white"
                  value={formData.previousMedication}
                  onChange={e => setFormData({ ...formData, previousMedication: e.target.value as MedicationType })}
                >
                  <option value="None">None</option>
                  <option value="Paracetamol">Paracetamol</option>
                  <option value="Ibuprofen">Ibuprofen</option>
                </select>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <label className="block">
                  <span className="flex items-center text-sm font-semibold text-gray-700 mb-1.5">
                    <Droplets className="w-4 h-4 mr-2 text-blue-500" />
                    Paracetamol Conc.
                  </span>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none bg-white"
                    value={formData.paracetamolConcentration}
                    onChange={e => setFormData({ ...formData, paracetamolConcentration: e.target.value })}
                  >
                    {PARACETAMOL_CONCENTRATIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="flex items-center text-sm font-semibold text-gray-700 mb-1.5">
                    <Droplets className="w-4 h-4 mr-2 text-orange-500" />
                    Ibuprofen Conc.
                  </span>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none bg-white"
                    value={formData.ibuprofenConcentration}
                    onChange={e => setFormData({ ...formData, ibuprofenConcentration: e.target.value })}
                  >
                    {IBUPROFEN_CONCENTRATIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-100 transition-all transform active:scale-[0.98] flex items-center justify-center space-x-2"
            >
              <Calculator className="w-5 h-5" />
              <span>Calculate Dose & Schedule</span>
            </button>
          </form>
        </motion.div>

        {/* Results Section */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {results ? (
              <motion.div
                key="results"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-6 space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" />
                    Calculated Doses
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Paracetamol</p>
                      <p className="text-2xl font-bold text-blue-900">{results.paracetamolDose} <span className="text-sm font-medium">mL</span></p>
                      <p className="text-[10px] text-blue-500 mt-1">{formData.paracetamolConcentration}</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                      <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">Ibuprofen</p>
                      <p className="text-2xl font-bold text-orange-900">{results.ibuprofenDose} <span className="text-sm font-medium">mL</span></p>
                      <p className="text-[10px] text-orange-500 mt-1">{formData.ibuprofenConcentration}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 p-6 space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <History className="w-5 h-5 mr-2 text-blue-500" />
                    Medication Schedule
                  </h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {results.schedule.map((item, idx) => (
                      <div key={idx} className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
                        <div className="w-16 text-sm font-bold text-gray-500">{format(item.time, 'HH:mm')}</div>
                        <div className="flex-1">
                          <p className={cn(
                            "text-sm font-semibold",
                            item.medication === 'Paracetamol' ? "text-blue-600" : "text-orange-600"
                          )}>
                            {item.medication}
                          </p>
                          <p className="text-xs text-gray-400">{item.dose} {item.unit}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={isSubmitting}
                    className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                    <span>Download PDF Report</span>
                  </button>
                  
                  {status && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-4 rounded-xl flex items-start space-x-3",
                        status.type === 'success' ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                      )}
                    >
                      {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" /> : <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />}
                      <p className="text-sm font-medium">{status.message}</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200"
              >
                <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
                  <FileText className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No calculation yet</h3>
                <p className="text-sm text-gray-500 mt-2">Enter patient details and click calculate to generate a safe medication schedule.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <footer className="pt-8 border-t border-gray-100 text-center space-y-4">
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100 text-left space-y-3">
          <h4 className="text-red-800 font-bold flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Safety Notice
          </h4>
          <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
            <li>Always use a proper measuring syringe</li>
            <li>Do not exceed maximum daily doses</li>
            <li>Do not give Paracetamol more frequently than every 4 hours</li>
            <li>Do not give Ibuprofen more frequently than every 6 hours</li>
          </ul>
        </div>
        <div className="text-gray-400 text-sm">
          <p>© 2019 Paraibu Dose Calculation. All rights reserved.</p>
          <p>Contact us: <a href="mailto:paraibu19@gmail.com" className="text-blue-500 hover:underline">paraibu19@gmail.com</a></p>
        </div>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}

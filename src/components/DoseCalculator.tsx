import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, addHours } from 'date-fns';
import { Calculator, User, FileText, AlertCircle, CheckCircle2, Loader2, ChevronRight, History, Scale, Droplets, Languages } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { MedicationType, ScheduleItem, FormData } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import * as arabicReshaper from 'arabic-reshaper';

const translations = {
  en: {
    title: "Paraibu Dose Calculation",
    subtitle: "Professional pediatric medication dose calculation assistant.",
    patientNameLabel: "Patient Name",
    patientNamePlaceholder: "Enter child's name",
    weightLabel: "Patient Weight (kg)",
    weightPlaceholder: "Enter weight in kg",
    prevMedLabel: "Previous Medication Taken",
    none: "None",
    paracetamol: "Paracetamol",
    ibuprofen: "Ibuprofen",
    paraConc: "Paracetamol Conc.",
    ibuConc: "Ibuprofen Conc.",
    calculateBtn: "Calculate Dose & Schedule",
    calculatedDoses: "Calculated Doses",
    medSchedule: "Medication Schedule",
    downloadPdf: "Download PDF Report",
    safetyNotice: "Safety Notice",
    safety1: "Always use a proper measuring syringe",
    safety2: "Do not exceed maximum daily doses",
    safety3: "Do not give Paracetamol more frequently than every 4 hours",
    safety4: "Do not give Ibuprofen more frequently than every 6 hours",
    copyright: "© 2019 Paraibu Dose Calculation. All rights reserved.",
    contact: "Contact us:",
    successPdf: "PDF downloaded successfully!",
    errorPdf: "Failed to generate PDF. Please try again.",
    noCalcTitle: "No calculation yet",
    noCalcSub: "Enter patient details and click calculate to generate a safe medication schedule.",
    time: "Time",
    medication: "Medication",
    dose: "Dose",
    submittedOn: "Submitted on",
    dear: "Dear",
    patientWeight: "Patient weight",
    selectedMeds: "Selected Medications",
    kg: "kg",
    ml: "mL",
    unit: "mL",
    heroTitle: "Safe Dosing for Every Child",
    heroSubtitle: "Accurate pediatric medication calculations you can trust."
  },
  ar: {
    title: "بارايبو - حساب الجرعة",
    subtitle: "مساعد مهني لحساب جرعات أدوية الأطفال.",
    patientNameLabel: "اسم المريض",
    patientNamePlaceholder: "أدخل اسم الطفل",
    weightLabel: "وزن المريض (كجم)",
    weightPlaceholder: "أدخل الوزن بالكجم",
    prevMedLabel: "الدواء السابق الذي تم تناوله",
    none: "لا يوجد",
    paracetamol: "باراسيتامول",
    ibuprofen: "إيبوبروفين",
    paraConc: "تركيز الباراسيتامول",
    ibuConc: "تركيز الإيبوبروفين",
    calculateBtn: "حساب الجرعة والجدول الزمني",
    calculatedDoses: "الجرعات المحسوبة",
    medSchedule: "جدول الأدوية",
    downloadPdf: "تحميل تقرير PDF",
    safetyNotice: "ملاحظة السلامة",
    safety1: "استخدم دائماً سرنجة قياس مناسبة",
    safety2: "لا تتجاوز الجرعات اليومية القصوى",
    safety3: "لا تعطي الباراسيتامول أكثر من مرة كل 4 ساعات",
    safety4: "لا تعطي الإيبوبروفين أكثر من مرة كل 6 ساعات",
    copyright: "© 2019 بارايبو لحساب الجرعة. جميع الحقوق محفوظة.",
    contact: "اتصل بنا:",
    successPdf: "تم تحميل ملف PDF بنجاح!",
    errorPdf: "فشل إنشاء ملف PDF. يرجى المحاولة مرة أخرى.",
    noCalcTitle: "لا توجد حسابات بعد",
    noCalcSub: "أدخل تفاصيل المريض وانقر على حساب لإنشاء جدول أدوية آمن.",
    time: "الوقت",
    medication: "الدواء",
    dose: "الجرعة",
    submittedOn: "تم التقديم في",
    dear: "عزيزي",
    patientWeight: "وزن المريض",
    selectedMeds: "الأدوية المختارة",
    kg: "كجم",
    ml: "مل",
    unit: "مل",
    heroTitle: "جرعات آمنة لكل طفل",
    heroSubtitle: "حسابات دقيقة لأدوية الأطفال يمكنك الوثوق بها."
  }
};

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
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const t = translations[language];
  const isRTL = language === 'ar';

  const [formData, setFormData] = useState<FormData>({
    patientName: '',
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

  const handleDownloadPDF = async () => {
    if (!results) return;
    setIsSubmitting(true);
    setStatus(null);

    try {
      const doc = new jsPDF();
      const en = translations.en;
      const now = new Date();
      const timestamp = format(now, 'yyyy-MM-dd HH:mm:ss');

      // Header
      doc.setFontSize(22);
      doc.setTextColor(41, 128, 185);
      doc.text(en.title, 105, 20, { align: 'center' });

      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`${en.submittedOn}: ${timestamp}`, 105, 30, { align: 'center' });

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(`${en.dear} ${formData.patientName},`, 20, 45);
      doc.text(`${en.patientWeight}: ${formData.weight} ${en.kg}`, 20, 55);

      // Medications
      doc.setDrawColor(200);
      doc.line(20, 65, 190, 65);
      doc.setFontSize(16);
      doc.text(en.selectedMeds + ':', 20, 75);

      doc.setFontSize(12);
      doc.text(`Paracetamol: ${formData.paracetamolConcentration} -> ${en.dose}: ${results.paracetamolDose} ${en.ml}`, 25, 85);
      doc.text(`Ibuprofen: ${formData.ibuprofenConcentration} -> ${en.dose}: ${results.ibuprofenDose} ${en.ml}`, 25, 95);

      doc.line(20, 105, 190, 105);

      // Schedule
      doc.setFontSize(16);
      doc.text(en.medSchedule + ':', 20, 115);

      const tableData = results.schedule.map(item => [
        format(item.time, 'HH:mm'),
        item.medication,
        `${item.dose} ${item.unit}`
      ]);

      autoTable(doc, {
        startY: 120,
        head: [[en.time, en.medication, en.dose]],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }
      });

      // Safety Notice
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(16);
      doc.text(en.safetyNotice + ':', 20, finalY);
      doc.setFontSize(10);
      doc.setTextColor(150, 0, 0);
      const notices = [
        en.safety1,
        en.safety2,
        en.safety3,
        en.safety4
      ];
      notices.forEach((notice, index) => {
        doc.text(`- ${notice}`, 25, finalY + 10 + (index * 7));
      });

      // Footer
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`${en.copyright} | Contact: paraibu19@gmail.com`, 105, pageHeight - 10, { align: 'center' });

      doc.save(`Paraibu_${formData.patientName.replace(/\s+/g, '_')}_Report.pdf`);
      setStatus({ type: 'success', message: t.successPdf });
    } catch (error) {
      console.error('PDF Generation Error:', error);
      setStatus({ type: 'error', message: t.errorPdf });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("min-h-screen bg-gray-50/50", isRTL && "font-sans")} dir={isRTL ? "rtl" : "ltr"}>
      {/* Language Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setLanguage(l => l === 'en' ? 'ar' : 'en')}
          className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-gray-200 hover:bg-white transition-all text-sm font-semibold text-gray-700"
        >
          <Languages className="w-4 h-4" />
          <span>{language === 'en' ? 'العربية' : 'English'}</span>
        </button>
      </div>

      {/* Hero Section with Poster */}
      <section className="relative h-[400px] md:h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/poster.jpg" 
            alt="Paraibu Hero"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1631217818242-5033523c5735?auto=format&fit=crop&q=80&w=2000";
            }}
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent" />
        </div>
        
        <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-end pb-12 md:pb-20">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl space-y-4"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-full text-blue-100 text-xs font-bold uppercase tracking-wider">
              <Calculator className="w-3 h-3" />
              <span>{t.title}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight">
              {t.heroTitle}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 font-medium max-w-lg">
              {t.heroSubtitle}
            </p>
          </motion.div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 -mt-10 md:-mt-16 pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Section */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="lg:col-span-5 bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 p-8 md:p-10"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{t.calculateBtn}</h2>
              <p className="text-gray-500 text-sm mt-1">{t.subtitle}</p>
            </div>

            <form onSubmit={handleCalculate} className="space-y-8">
            <div className="space-y-4">
              <label className="block">
                <span className={cn("flex items-center text-sm font-semibold text-gray-700 mb-1.5", isRTL && "flex-row-reverse")}>
                  <User className={cn("w-4 h-4 text-blue-500", isRTL ? "ml-2" : "mr-2")} />
                  {t.patientNameLabel}
                </span>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder={t.patientNamePlaceholder}
                  value={formData.patientName}
                  onChange={e => setFormData({ ...formData, patientName: e.target.value })}
                />
              </label>

              <label className="block">
                <span className={cn("flex items-center text-sm font-semibold text-gray-700 mb-1.5", isRTL && "flex-row-reverse")}>
                  <Scale className={cn("w-4 h-4 text-blue-500", isRTL ? "ml-2" : "mr-2")} />
                  {t.weightLabel}
                </span>
                <input
                  type="number"
                  step="0.1"
                  required
                  min="1"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  placeholder={t.weightPlaceholder}
                  value={formData.weight || ''}
                  onChange={e => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                />
              </label>

              <label className="block">
                <span className={cn("flex items-center text-sm font-semibold text-gray-700 mb-1.5", isRTL && "flex-row-reverse")}>
                  <History className={cn("w-4 h-4 text-blue-500", isRTL ? "ml-2" : "mr-2")} />
                  {t.prevMedLabel}
                </span>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none bg-white"
                  value={formData.previousMedication}
                  onChange={e => setFormData({ ...formData, previousMedication: e.target.value as MedicationType })}
                >
                  <option value="None">{t.none}</option>
                  <option value="Paracetamol">{t.paracetamol}</option>
                  <option value="Ibuprofen">{t.ibuprofen}</option>
                </select>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <label className="block">
                  <span className={cn("flex items-center text-sm font-semibold text-gray-700 mb-1.5", isRTL && "flex-row-reverse")}>
                    <Droplets className={cn("w-4 h-4 text-blue-500", isRTL ? "ml-2" : "mr-2")} />
                    {t.paraConc}
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
                  <span className={cn("flex items-center text-sm font-semibold text-gray-700 mb-1.5", isRTL && "flex-row-reverse")}>
                    <Droplets className={cn("w-4 h-4 text-orange-500", isRTL ? "ml-2" : "mr-2")} />
                    {t.ibuConc}
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
              <Calculator className={cn("w-5 h-5", isRTL ? "ml-2" : "mr-2")} />
              <span>{t.calculateBtn}</span>
            </button>
          </form>
        </motion.div>

          {/* Results Section */}
          <div className="lg:col-span-7 space-y-8">
            <AnimatePresence mode="wait">
              {results ? (
                <motion.div
                  key="results"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="space-y-8"
                >
                  <div 
                    className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 p-8 space-y-6"
                  >
                    <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                      <h3 className="text-xl font-bold text-gray-900 flex items-center">
                        <CheckCircle2 className={cn("w-6 h-6 text-green-500", isRTL ? "ml-3" : "mr-3")} />
                        {t.calculatedDoses}
                      </h3>
                      <button
                        onClick={handleDownloadPDF}
                        disabled={isSubmitting}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black transition-all disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        <span>{t.downloadPdf}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="p-6 rounded-3xl border border-blue-100 bg-blue-50/50">
                        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">{t.paracetamol}</p>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-4xl font-black text-blue-900">{results.paracetamolDose}</span>
                          <span className="text-lg font-bold text-blue-700">{t.ml}</span>
                        </div>
                        <p className="text-xs font-medium text-blue-500 mt-2">{formData.paracetamolConcentration}</p>
                      </div>
                      <div className="p-6 rounded-3xl border border-orange-100 bg-orange-50/50">
                        <p className="text-xs font-bold uppercase tracking-widest text-orange-600 mb-2">{t.ibuprofen}</p>
                        <div className="flex items-baseline space-x-2">
                          <span className="text-4xl font-black text-orange-900">{results.ibuprofenDose}</span>
                          <span className="text-lg font-bold text-orange-700">{t.ml}</span>
                        </div>
                        <p className="text-xs font-medium text-orange-500 mt-2">{formData.ibuprofenConcentration}</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 p-8 space-y-6"
                  >
                    <h3 className={cn("text-xl font-bold text-gray-900 flex items-center", isRTL && "flex-row-reverse")}>
                      <History className={cn("w-6 h-6 text-blue-500", isRTL ? "ml-3" : "mr-3")} />
                      {t.medSchedule}
                    </h3>
                    <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {results.schedule.map((item, idx) => (
                        <div 
                          key={idx} 
                          className={cn("flex items-center p-4 rounded-2xl border border-gray-100 bg-gray-50/50 group hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300", isRTL && "flex-row-reverse")}
                        >
                          <div className={cn("w-20 text-base font-black text-gray-400 group-hover:text-blue-600 transition-colors", isRTL ? "text-right" : "text-left")}>
                            {format(item.time, 'HH:mm')}
                          </div>
                          <div className="flex-1 px-4">
                            <p className={cn("text-sm font-bold", item.medication === 'Paracetamol' ? "text-blue-600" : "text-orange-600")}>
                              {item.medication === 'Paracetamol' ? t.paracetamol : t.ibuprofen}
                            </p>
                            <p className="text-xs font-bold text-gray-400 mt-0.5">{item.dose} {t.unit}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                            <ChevronRight className={cn("w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors", isRTL && "rotate-180")} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {status && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-6 rounded-3xl flex items-start space-x-4",
                        status.type === 'success' ? "bg-green-50 text-green-800 border border-green-100" : "bg-red-50 text-red-800 border border-red-100",
                        isRTL && "flex-row-reverse space-x-reverse"
                      )}
                    >
                      {status.type === 'success' ? <CheckCircle2 className="w-6 h-6 mt-0.5 shrink-0" /> : <AlertCircle className="w-6 h-6 mt-0.5 shrink-0" />}
                      <p className="text-sm font-bold leading-relaxed">{status.message}</p>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-200"
                >
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                    <FileText className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{t.noCalcTitle}</h3>
                  <p className="text-gray-500 mt-3 max-w-xs leading-relaxed">{t.noCalcSub}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <footer className="mt-16 pt-12 border-t border-gray-200 space-y-8">
          <div className={cn("bg-red-50/50 p-8 rounded-[2.5rem] border border-red-100 text-left space-y-4", isRTL && "text-right")}>
            <h4 className={cn("text-red-900 text-lg font-black flex items-center", isRTL && "flex-row-reverse")}>
              <AlertCircle className={cn("w-6 h-6", isRTL ? "ml-3" : "mr-3")} />
              {t.safetyNotice}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[t.safety1, t.safety2, t.safety3, t.safety4].map((notice, i) => (
                <div key={i} className={cn("flex items-center space-x-3 text-red-700 font-bold text-sm", isRTL && "flex-row-reverse space-x-reverse")}>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span>{notice}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-gray-400 text-sm font-medium">{t.copyright}</p>
            <p className="text-gray-400 text-sm font-medium">
              {t.contact} <a href="mailto:paraibu19@gmail.com" className="text-blue-600 hover:underline">paraibu19@gmail.com</a>
            </p>
          </div>
        </footer>
      </main>

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

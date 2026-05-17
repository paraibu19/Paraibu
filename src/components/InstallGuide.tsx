import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, MoreVertical, Smartphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const InstallGuide: React.FC = () => {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if app is already running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) return;

    // Detect browser/OS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isAndroidDevice = /android/.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const isChrome = /chrome|crios/.test(ua);

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // Show guide after a short delay
    const timer = setTimeout(() => {
      if (isIosDevice || isAndroidDevice) {
        setShow(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-6 relative overflow-hidden">
          <button 
            onClick={() => setShow(false)}
            className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-xl">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 leading-tight">
                Add Paraibu App to Home Screen
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Add to your home screen for quick access.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {isIOS ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center font-medium">1</span>
                  <span>Tap the <Share className="w-4 h-4 inline text-blue-600 mx-1" /> icon in the bottom bar.</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center font-medium">2</span>
                  <span>Scroll down and tap <PlusSquare className="w-4 h-4 inline text-blue-600 mx-1" /> "Add to Home Screen".</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center font-medium">1</span>
                  <span>Tap the <MoreVertical className="w-4 h-4 inline text-blue-600 mx-1" /> menu icon in the top right.</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center font-medium">2</span>
                  <span>Select "Install app" or "Add to Home Screen".</span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShow(false)}
              className="w-full bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              Got it
            </button>
          </div>

          {/* Decorative Background Element */}
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-50 rounded-full -z-10 opacity-50" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InstallGuide;

import React, { useEffect, useState } from 'react';
import { 
  Smartphone, 
  Download, 
  X, 
  Check, 
  ArrowUpRight, 
  Share, 
  PlusSquare, 
  Info, 
  Sparkles,
  SmartphoneIcon,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAlreadyStandalone, setIsAlreadyStandalone] = useState(false);
  const [showDetailedModal, setShowDetailedModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone (installed) mode
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone || 
      document.referrer.includes('android-app://');
    
    setIsAlreadyStandalone(!!isStandalone);

    // 2. Detect iOS platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // 3. Check if user dismissed the prompt in this session or previously
    const isDismissed = localStorage.getItem('hostelease_install_prompt_dismissed');

    // If already installed, don't listen or show anything
    if (isStandalone) return;

    // 4. Listen for beforeinstallprompt event (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Only show automatically if not dismissed previously
      if (!isDismissed) {
        // Delay slightly for smooth page entrance
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. For iOS, we can prompt automatically after a short delay since beforeinstallprompt won't fire
    if (ios && !isDismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Trigger native browser install prompt
      deferredPrompt.prompt();
      
      // Wait for the user's decision
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User installation choice: ${outcome}`);
      
      if (outcome === 'accepted') {
        setInstallSuccess(true);
        setShowPrompt(false);
        setDeferredPrompt(null);
        setTimeout(() => setInstallSuccess(false), 5000);
      }
    } else if (isIOS) {
      // For iOS, open the step-by-step instructions modal
      setShowDetailedModal(true);
      setShowPrompt(false);
    } else {
      // Fallback for general browsers or if prompt hasn't fired yet
      setShowDetailedModal(true);
      setShowPrompt(false);
    }
  };

  const dismissPrompt = () => {
    localStorage.setItem('hostelease_install_prompt_dismissed', 'true');
    setShowPrompt(false);
  };

  const forceShowPromptFromSettings = () => {
    setShowDetailedModal(true);
  };

  // Expose function globally so we can trigger it from anywhere (e.g. Profile or Navigation menu)
  useEffect(() => {
    (window as any).triggerInstallGuide = () => {
      setShowDetailedModal(true);
    };
    return () => {
      delete (window as any).triggerInstallGuide;
    };
  }, []);

  if (isAlreadyStandalone) {
    return null; // Don't show anything if already installed
  }

  return (
    <>
      {/* 1. Subtle, Beautiful Floating Sticky Banner (Bottom of Screen) */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-50"
          >
            <div className="bg-slate-900/90 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-4 shadow-2xl shadow-indigo-500/10 relative overflow-hidden">
              {/* Top ambient glow */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

              <button 
                onClick={dismissPrompt}
                className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start space-x-3 pr-6">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2.5 rounded-xl shrink-0 text-white shadow-lg shadow-indigo-600/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h4 className="text-xs font-semibold text-white">Install HostelEase Mobile</h4>
                    <span className="bg-indigo-500/10 text-indigo-400 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">PWA</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    Install as a home-screen app for instant access, offline mode, and 0% storage struggle.
                  </p>
                  
                  <div className="flex items-center space-x-2 mt-3.5">
                    <button
                      onClick={handleInstallClick}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold py-1.5 px-3.5 rounded-lg flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{deferredPrompt ? 'Install App' : 'Get Mobile Guide'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailedModal(true);
                        setShowPrompt(false);
                      }}
                      className="text-slate-400 hover:text-slate-200 text-[10px] font-medium py-1.5 px-2.5 transition-colors"
                    >
                      How it works
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Full PWA Success Notification Toast */}
      <AnimatePresence>
        {installSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/90 backdrop-blur-xl border border-emerald-500/20 text-emerald-300 py-3 px-6 rounded-full flex items-center space-x-2 shadow-xl shadow-emerald-950/20"
          >
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium font-mono">App successfully added to Home Screen!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. High-Fidelity Step-by-Step Installation Modal Guide */}
      <AnimatePresence>
        {showDetailedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0D0D11] border border-white/5 w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Background ambient radial gradients */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

              <button 
                onClick={() => setShowDetailedModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 p-3.5 rounded-2xl text-indigo-400 border border-indigo-500/15 mb-4">
                  <Smartphone className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-light text-white tracking-tight">HostelEase Mobile Experience</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                  Run HostelEase directly on your smartphone as a standard web application. No Google Play or App Store download required.
                </p>
              </div>

              {/* Benefits Bento */}
              <div className="grid grid-cols-2 gap-3 mb-6 bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                <div className="flex items-center space-x-2 text-[11px] text-slate-300">
                  <div className="bg-indigo-500/10 p-1 rounded text-indigo-400"><Sparkles className="w-3.5 h-3.5" /></div>
                  <span>Instant 1-Tap Access</span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-slate-300">
                  <div className="bg-indigo-500/10 p-1 rounded text-indigo-400"><Check className="w-3.5 h-3.5" /></div>
                  <span>Zero MB App Storage</span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-slate-300">
                  <div className="bg-indigo-500/10 p-1 rounded text-indigo-400"><Info className="w-3.5 h-3.5" /></div>
                  <span>Safe & Secure Sandboxed</span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] text-slate-300">
                  <div className="bg-indigo-500/10 p-1 rounded text-indigo-400"><Download className="w-3.5 h-3.5" /></div>
                  <span>Always Autoupdated</span>
                </div>
              </div>

              {/* Instructions dynamic tabs */}
              <div className="space-y-4">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-mono">Simple Steps for your Phone</p>

                {isIOS ? (
                  /* iOS / Safari Steps */
                  <div className="space-y-3.5">
                    <div className="flex items-start space-x-3 bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                      <span className="flex items-center justify-center bg-indigo-500/10 text-indigo-400 font-mono text-[10px] font-bold w-5 h-5 rounded-full mt-0.5">1</span>
                      <div className="text-xs text-slate-300">
                        <p className="font-semibold text-white">Open in Safari Browser</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Make sure you are currently visiting via Safari on your iPhone.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                      <span className="flex items-center justify-center bg-indigo-500/10 text-indigo-400 font-mono text-[10px] font-bold w-5 h-5 rounded-full mt-0.5">2</span>
                      <div className="text-xs text-slate-300">
                        <p className="font-semibold text-white flex items-center">
                          Tap the Share Button
                          <Share className="w-3.5 h-3.5 text-indigo-400 mx-1.5 shrink-0 inline" />
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Find the system action bar at the bottom of Safari.</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                      <span className="flex items-center justify-center bg-indigo-500/10 text-indigo-400 font-mono text-[10px] font-bold w-5 h-5 rounded-full mt-0.5">3</span>
                      <div className="text-xs text-slate-300">
                        <p className="font-semibold text-white flex items-center">
                          Select "Add to Home Screen"
                          <PlusSquare className="w-3.5 h-3.5 text-indigo-400 mx-1.5 shrink-0 inline" />
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Scroll down slightly in the menu list and select it.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Android / Chrome / Edge Steps */
                  <div className="space-y-3.5">
                    {deferredPrompt ? (
                      <div className="bg-indigo-600/10 border border-indigo-500/25 p-4 rounded-2xl text-center">
                        <p className="text-xs text-slate-200">Your Android/Chrome browser supports instant 1-tap installation!</p>
                        <button
                          onClick={handleInstallClick}
                          className="mt-3 inline-flex bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-5 rounded-xl items-center space-x-2 transition-all cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Install HostelEase Now</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        <div className="flex items-start space-x-3 bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                          <span className="flex items-center justify-center bg-indigo-500/10 text-indigo-400 font-mono text-[10px] font-bold w-5 h-5 rounded-full mt-0.5">1</span>
                          <div className="text-xs text-slate-300">
                            <p className="font-semibold text-white">Tap the 3-dots Menu</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Open Chrome on your phone, and tap the vertical dots in the top-right corner.</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                          <span className="flex items-center justify-center bg-indigo-500/10 text-indigo-400 font-mono text-[10px] font-bold w-5 h-5 rounded-full mt-0.5">2</span>
                          <div className="text-xs text-slate-300">
                            <p className="font-semibold text-white">Tap "Install App" or "Add to Home Screen"</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">A small system prompt will confirm installation instantly.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-white/5">
                <button
                  onClick={() => setShowDetailedModal(false)}
                  className="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold py-2.5 px-5 rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

import React, { useState } from 'react';
import { X, Send, CheckCircle2, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface TalkToUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TalkToUsModal({ isOpen, onClose }: TalkToUsModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    interest: 'segmentation',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    const inquiryId = `inq-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const path = `contact_inquiries/${inquiryId}`;

    try {
      await setDoc(doc(db, 'contact_inquiries', inquiryId), {
        name: formData.name.trim().slice(0, 100),
        email: formData.email.trim().slice(0, 150),
        company: formData.company.trim().slice(0, 120),
        interest: formData.interest.slice(0, 60),
        message: formData.message.trim().slice(0, 2000),
        status: 'new',
        createdAt: new Date().toISOString()
      });
      setIsSuccess(true);
    } catch (error) {
      console.error('Failed to save inquiry to Firestore:', error);
      try {
        handleFirestoreError(error, OperationType.CREATE, path);
      } catch {
        // Fallback display to ensure user feedback
        setErrorMsg('Submission could not be completed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0b0c0e]/40 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="relative w-full max-w-lg bg-white rounded-3xl border border-black/5 shadow-2xl overflow-hidden z-10"
          >
            {/* Top design stripe */}
            <div className="h-2 bg-gradient-to-r from-[#5d8ae8] via-[#8baeef] to-[#2c56b4]" />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {!isSuccess ? (
              <div className="p-8">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="text-[#5d8ae8]" size={18} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#5d8ae8]">RACE Intelligence</span>
                </div>
                <h3 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-2">
                  Stop guessing. Start knowing.
                </h3>
                <p className="text-sm text-neutral-500 mb-6 leading-relaxed">
                  Let's explore what RACE customer intelligence can unlock for your business growth and retention metrics.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1.5">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Sidharth Rajput"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#5d8ae8] focus:bg-white transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5">Business Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@company.com"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#5d8ae8] focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5">Company</label>
                      <input
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Thriwe"
                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#5d8ae8] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1.5">Primary Interest</label>
                    <select
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#5d8ae8] focus:bg-white transition-all appearance-none cursor-pointer"
                    >
                      <option value="segmentation">Segmentation & Customer Profile Matching</option>
                      <option value="retention">Churn Prediction & Retention Strategy</option>
                      <option value="engagement">Omnichannel Lifecycle Engagement</option>
                      <option value="all">Full RACE Ecosystem Implementation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1.5">How can we help you?</label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Briefly tell us about your customer data scale or challenges..."
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#5d8ae8] focus:bg-white transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 focus:outline-none flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Submit Request</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mb-4 shadow-sm">
                  <CheckCircle2 size={30} />
                </div>
                <h4 className="text-2xl font-bold text-neutral-900 mb-2">Request Received, {formData.name}!</h4>
                <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6 leading-relaxed">
                  Thank you for reaching out. A Thriwe RACE enterprise architect is reviewing your details and will get back to you at <span className="font-semibold text-neutral-800">{formData.email}</span> within 24 hours.
                </p>

                <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 max-w-sm mx-auto mb-6 flex items-start gap-3 text-left">
                  <div className="p-2 rounded-xl bg-neutral-100 text-[#5d8ae8] mt-0.5">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-neutral-800">Priority Review Initiated</span>
                    <span className="block text-xs text-neutral-400 mt-0.5">Assigned to: Enterprise Solutions Team</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsSuccess(false);
                    setFormData({ name: '', email: '', company: '', interest: 'segmentation', message: '' });
                    onClose();
                  }}
                  className="px-6 py-2.5 bg-neutral-900 text-white hover:bg-neutral-800 rounded-full text-xs font-semibold transition-colors"
                >
                  Close Window
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

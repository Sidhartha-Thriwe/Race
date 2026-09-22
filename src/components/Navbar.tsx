import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  onOpenContact: () => void;
}

export default function Navbar({ onOpenContact }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { label: 'How it works', href: '#how-it-works' },
    { label: 'The Engines', href: '#engines' },
    { label: 'Use cases', href: '#use-cases' },
    { label: 'Why RACE', href: '#why-race' },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/80 backdrop-blur-xl border-b border-neutral-100 shadow-sm py-3' 
        : 'bg-white/40 backdrop-blur-md border-b border-transparent py-4'
    }`}>
      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 flex items-center justify-between gap-6">
        {/* Logo */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <img 
            src="/race-logo.png" 
            alt="RACE Logo" 
            className="w-7 h-7 object-contain transition-transform group-hover:scale-105" 
            referrerPolicy="no-referrer"
          />
          <span className="text-[15px] font-semibold tracking-tight text-neutral-900">
            RACE <span className="text-neutral-400 font-normal">by Thriwe</span>
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-[13.5px] font-medium text-neutral-500">
          {menuItems.map((item, i) => (
            <a
              key={i}
              href={item.href}
              onClick={(e) => handleLinkClick(e, item.href)}
              className="hover:text-neutral-900 transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1.5px] after:bg-[#5d8ae8] hover:after:w-full after:transition-all"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              onOpenContact();
            }}
            className="hover:text-neutral-900 transition-colors"
          >
            Contact
          </a>
        </nav>

        {/* Desktop CTA actions */}
        <div className="hidden md:flex items-center">
          <button
            onClick={onOpenContact}
            className="px-5 py-2.5 bg-[#0b0c0e] hover:bg-neutral-800 text-white rounded-full text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>Talk to us</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-neutral-100 overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4 text-sm font-medium text-neutral-600">
              {menuItems.map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  onClick={(e) => handleLinkClick(e, item.href)}
                  className="hover:text-neutral-900 transition-colors py-1"
                >
                  {item.label}
                </a>
              ))}
              <a
                href="#contact"
                onClick={(e) => {
                  e.preventDefault();
                  setIsMobileMenuOpen(false);
                  onOpenContact();
                }}
                className="hover:text-neutral-900 transition-colors py-1"
              >
                Contact
              </a>
              
              <div className="pt-2 border-t border-neutral-100 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenContact();
                  }}
                  className="w-full py-2.5 bg-[#0b0c0e] text-white rounded-xl text-xs font-semibold text-center"
                >
                  Talk to us
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

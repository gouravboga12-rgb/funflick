import React from 'react';
import { useApp } from '../../context/AppContext';
import { MobileAdPopup } from './MobileAdPopup';

export const PhoneFrame = ({ children }) => {
  const { theme } = useApp();
  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen ${isLight ? 'bg-slate-100 text-slate-900 light' : 'bg-[#06040d] text-white dark'} flex justify-center transition-colors duration-200`}>
      {/* Centered Mobile Layout without any fake phone device frame or bezel */}
      <div className={`w-full max-w-[440px] min-h-screen ${isLight ? 'bg-[#f8fafc] text-slate-900 border-slate-200/80 shadow-xl' : 'bg-[#090514] text-white border-white/5 shadow-2xl'} border-x flex flex-col relative transition-colors duration-200`}>
        {children}
        {/* Mobile Screen Popup Advertisements Engine */}
        <MobileAdPopup />
      </div>
    </div>
  );
};

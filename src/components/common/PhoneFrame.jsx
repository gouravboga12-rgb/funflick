import React from 'react';

export const PhoneFrame = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#06040d] text-white flex justify-center">
      {/* Centered Mobile Layout without any fake phone device frame or bezel */}
      <div className="w-full max-w-[440px] min-h-screen bg-[#090514] border-x border-white/5 shadow-2xl flex flex-col relative">
        {children}
      </div>
    </div>
  );
};

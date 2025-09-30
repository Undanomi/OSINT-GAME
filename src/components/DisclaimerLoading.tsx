'use client';

import React, { useState, useEffect } from 'react';

interface DisclaimerLoadingProps {
  onComplete: () => void;
}

export const DisclaimerLoading: React.FC<DisclaimerLoadingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);

  const steps = [
    "この物語はフィクションであり、",
    "実在の人物・団体とは一切関係ありません。",
    "調査スキルの向上を目的とした",
    "教育的なシミュレーションです。"
  ];

  useEffect(() => {
    setFadeIn(true);

    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setFadeIn(false);
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
        }, 500);
      } else {
        // 最後のステップから2秒後に完了
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentStep, steps.length, onComplete]);

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 flex items-center justify-center relative overflow-hidden">
      {/* 背景アニメーション */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute w-96 h-96 rounded-full bg-blue-500 blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 rounded-full bg-cyan-500 blur-3xl -bottom-48 -right-48 animate-pulse"></div>
      </div>

      <div className="relative z-10 text-center w-full max-w-4xl mx-auto px-8">
        {/* プログレスバー */}
        <div className="mb-12 w-full">
          <div className="w-96 mx-auto bg-white/20 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-cyan-300 text-sm">
            {currentStep + 1} / {steps.length}
          </p>
        </div>

        {/* メインテキスト */}
        <div className="mb-12 w-full">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-8">
            OSINT GAME
          </h1>

          <div className="min-h-[120px] flex items-center justify-center w-full max-w-2xl mx-auto">
            <p
              className={`text-xl md:text-2xl text-white leading-relaxed transition-all duration-500 ${
                fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              {steps[currentStep]}
            </p>
          </div>
        </div>

        {/* ローディングアニメーション */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { BaseApp } from '@/components/BaseApp';
import { AppProps } from '@/types/app';
import { Delete, Plus, Minus, X, Divide, Equal } from 'lucide-react';

export const CalculatorApp: React.FC<AppProps> = ({ windowId, isActive }) => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputOperator = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operator) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operator);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNewValue(true);
    setOperator(nextOperator);
  };

  const calculate = (firstValue: number, secondValue: number, operator: string) => {
    switch (operator) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    if (operator && previousValue !== null) {
      const inputValue = parseFloat(display);
      const newValue = calculate(previousValue, inputValue, operator);

      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperator(null);
      setWaitingForNewValue(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNewValue(false);
  };

  const inputDecimal = () => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const statusBar = `計算結果: ${display}${operator ? ` ${operator}` : ''}`;

  return (
    <BaseApp windowId={windowId} isActive={isActive} statusBar={statusBar}>
      <div className="h-full bg-gray-100 p-4">
        <div className="max-w-xs mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-black p-4">
            <div className="text-right text-white text-2xl font-mono min-h-[40px] flex items-center justify-end">
              {display}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 p-2">
            <button
              onClick={clear}
              className="col-span-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded transition-colors flex items-center justify-center"
            >
              <Delete size={18} className="mr-1" />
              C
            </button>
            <button
              onClick={() => inputOperator('÷')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded transition-colors flex items-center justify-center"
            >
              <Divide size={18} />
            </button>
            <button
              onClick={() => inputOperator('×')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded transition-colors flex items-center justify-center"
            >
              <X size={18} />
            </button>

            <button
              onClick={() => inputNumber('7')}
              className="bg-gray-300 hover:bg-gray-400 text-black font-semibold py-3 px-4 rounded transition-colors"
            >
              7
            </button>
            <button
              onClick={() => inputNumber('8')}
              className="bg-gray-300 hover:bg-gray-400 text-black font-semibold py-3 px-4 rounded transition-colors"
            >
              8
            </button>
            <button
              onClick={() => inputNumber('9')}
              className="bg-gray-300 hover:bg-gray-400 text-black font-semibold py-3 px-4 rounded transition-colors"
            >
              9
            </button>
            <button
              onClick={() => inputOperator('-')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded transition-colors flex items-center justify-center"
            >
              <Minus size={18} />
            </button>

            <button
              onClick={() => inputNumber('4')}
              className="bg-gray-300 hover:bg-gray-400 text-black font-semibold py-3 px-4 rounded transition-colors"
            >
              4
            </button>
            <button
              onClick={() => inputNumber('5')}
              className="bg-gray-300 hover:bg-gray-400 text-black font-semibold py-3 px-4 rounded transition-colors"
            >
              5
            </button>
            <button
              onClick={() => inputNumber('6')}
              className="bg-gray-300 hover:bg-gray-400 text-black font-semibold py-3 px-4 rounded transition-colors"
            >
              6
            </button>
            <button
              onClick={() => inputOperator('+')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded transition-colors flex items-center justify-center"
            >
              <Plus size={18} />
            </button>

            <button
              onClick={() => inputNumber('1')}
              className="bg-gray-300 hover:bg-gray-400 text-black font-semibold py-3 px-4 rounded transition-colors"
            >
              1
            </button>
            <button
              onClick={() => inputNumber('2')}
              className="bg-gray-300 hover:bg-gray-400 text-black font-semibold py-3 px-4 rounded transition-colors"
            >
              2
            </button>
            <button
              onClick={() => inputNumber('3')}
              className="bg-gray-300 hover:bg-gray-400 text-black font-semibold py-3 px-4 rounded transition-colors"
            >
              3
            </button>
            <button
              onClick={performCalculation}
              className="row-span-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded transition-colors flex items-center justify-center"
            >
              <Equal size={18} />
            </button>

            <button
              onClick={() => inputNumber('0')}
              className="col-span-2 bg-gray-300 hover:bg-gray-400 text-black font-semibold py-3 px-4 rounded transition-colors"
            >
              0
            </button>
            <button
              onClick={inputDecimal}
              className="bg-gray-300 hover:bg-gray-400 text-black font-semibold py-3 px-4 rounded transition-colors"
            >
              .
            </button>
          </div>
        </div>
      </div>
    </BaseApp>
  );
};
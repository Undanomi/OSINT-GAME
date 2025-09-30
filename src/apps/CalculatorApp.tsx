import React, { useState } from 'react';
import { BaseApp } from '@/components/BaseApp';
import { AppProps } from '@/types/app';
import { Delete, Plus, Minus, X, Divide, Equal } from 'lucide-react';

/**
 * 計算機アプリケーション - 基本的な四則演算機能を提供
 * iOS風のデザインと操作性を持つ電卓アプリ
 * 連続計算、小数点計算、クリア機能をサポート
 * 
 * @param windowId - アプリケーションウィンドウの一意識別子
 * @param isActive - アプリケーションがアクティブかどうかのフラグ
 * @returns JSX.Element - 計算機アプリケーションのレンダリング結果
 */
export const CalculatorApp: React.FC<AppProps> = ({ windowId, isActive }) => {
  // 現在表示されている数値または計算結果を管理
  const [display, setDisplay] = useState('0');
  // 前の計算値を保持（連続計算用）
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  // 現在選択されている演算子を管理
  const [operator, setOperator] = useState<string | null>(null);
  // 新しい値の入力待ち状態かどうかを管理
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  /**
   * 数字ボタンが押された時の処理
   * 新しい値の入力待ち状態または0の状態に応じて表示を更新
   * 
   * @param num - 入力された数字（文字列）
   */
  const inputNumber = (num: string) => {
    if (waitingForNewValue) {
      // 演算子入力後の新しい数字入力の場合、表示をクリアして新しい数字を表示
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      // 通常の数字入力の場合、既存の表示に追加（初期値0は置き換え）
      setDisplay(display === '0' ? num : display + num);
    }
  };

  /**
   * 演算子ボタンが押された時の処理
   * 連続計算の場合は途中結果を計算し、次の演算子を設定
   * 
   * @param nextOperator - 入力された演算子（+, -, ×, ÷）
   */
  const inputOperator = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      // 最初の演算子入力の場合、現在の値を保存
      setPreviousValue(inputValue);
    } else if (operator) {
      // 既に演算子が設定されている場合、連続計算を実行
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operator);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    // 次の数値入力を待つ状態に設定
    setWaitingForNewValue(true);
    setOperator(nextOperator);
  };

  /**
   * 四則演算を実行する関数
   * 指定された演算子に基づいて2つの数値を計算
   * 
   * @param firstValue - 第一オペランド
   * @param secondValue - 第二オペランド
   * @param operator - 演算子（+, -, ×, ÷）
   * @returns number - 計算結果
   */
  const calculate = (firstValue: number, secondValue: number, operator: string) => {
    switch (operator) {
      case '+':
        return firstValue + secondValue;  // 加算
      case '-':
        return firstValue - secondValue;  // 減算
      case '×':
        return firstValue * secondValue;  // 乗算
      case '÷':
        return firstValue / secondValue;  // 除算
      default:
        return secondValue;               // 不明な演算子の場合は第二オペランドを返す
    }
  };

  /**
   * イコール（=）ボタンが押された時の最終計算処理
   * 保存された演算子と値を使用して計算を完了し、状態をリセット
   */
  const performCalculation = () => {
    if (operator && previousValue !== null) {
      const inputValue = parseFloat(display);
      const newValue = calculate(previousValue, inputValue, operator);

      setDisplay(String(newValue));
      setPreviousValue(null);        // 計算完了後はクリア
      setOperator(null);             // 演算子もクリア
      setWaitingForNewValue(true);   // 次の入力を待つ状態に
    }
  };

  /**
   * クリア（C）ボタンが押された時の処理
   * すべての状態を初期値にリセット
   */
  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNewValue(false);
  };

  /**
   * 小数点ボタンが押された時の処理
   * 新しい値の入力開始または既存の値に小数点を追加
   * 既に小数点が含まれている場合は何もしない
   */
  const inputDecimal = () => {
    if (waitingForNewValue) {
      // 新しい値の開始として「0.」を表示
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (display.indexOf('.') === -1) {
      // まだ小数点が含まれていない場合のみ追加
      setDisplay(display + '.');
    }
  };

  // ステータスバーに表示する現在の状態情報
  const statusBar = `計算結果: ${display}${operator ? ` ${operator}` : ''}`;

  return (
    <BaseApp windowId={windowId} isActive={isActive} statusBar={statusBar}>
      <div className="h-full flex flex-col bg-gray-100">
        {/* ディスプレイエリア - 白い背景に黒い文字 */}
        <div className="bg-white p-6 border-b border-gray-300">
          <div className="text-right text-gray-800 text-3xl font-mono min-h-[50px] flex items-center justify-end">
            {display}
          </div>
        </div>

        {/* ボタングリッド - 4列のグリッドレイアウト */}
        <div className="flex-1 grid grid-cols-4 gap-2 p-4">
          {/* 第1行: クリア、割り算、掛け算 */}
          <button
            onClick={clear}
            className="col-span-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-4 rounded transition-colors flex items-center justify-center"
          >
            <Delete size={18} className="mr-1" />
            C
          </button>
          <button
            onClick={() => inputOperator('÷')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded transition-colors flex items-center justify-center"
          >
            <Divide size={18} />
          </button>
          <button
            onClick={() => inputOperator('×')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded transition-colors flex items-center justify-center"
          >
            <X size={18} />
          </button>

          {/* 第2行: 7, 8, 9, 引き算 */}
          <button
            onClick={() => inputNumber('7')}
            className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 rounded transition-colors border border-gray-300"
          >
            7
          </button>
          <button
            onClick={() => inputNumber('8')}
            className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 rounded transition-colors border border-gray-300"
          >
            8
          </button>
          <button
            onClick={() => inputNumber('9')}
            className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 rounded transition-colors border border-gray-300"
          >
            9
          </button>
          <button
            onClick={() => inputOperator('-')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded transition-colors flex items-center justify-center"
          >
            <Minus size={18} />
          </button>

          {/* 第3行: 4, 5, 6, 足し算 */}
          <button
            onClick={() => inputNumber('4')}
            className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 rounded transition-colors border border-gray-300"
          >
            4
          </button>
          <button
            onClick={() => inputNumber('5')}
            className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 rounded transition-colors border border-gray-300"
          >
            5
          </button>
          <button
            onClick={() => inputNumber('6')}
            className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 rounded transition-colors border border-gray-300"
          >
            6
          </button>
          <button
            onClick={() => inputOperator('+')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded transition-colors flex items-center justify-center"
          >
            <Plus size={18} />
          </button>

          {/* 第4-5行: 1, 2, 3, イコール（2行分） */}
          <button
            onClick={() => inputNumber('1')}
            className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 rounded transition-colors border border-gray-300"
          >
            1
          </button>
          <button
            onClick={() => inputNumber('2')}
            className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 rounded transition-colors border border-gray-300"
          >
            2
          </button>
          <button
            onClick={() => inputNumber('3')}
            className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 rounded transition-colors border border-gray-300"
          >
            3
          </button>
          {/* イコールボタン - 2行にわたって表示 */}
          <button
            onClick={performCalculation}
            className="row-span-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded transition-colors flex items-center justify-center"
          >
            <Equal size={18} />
          </button>

          {/* 最下行: 0（2列分）, 小数点 */}
          <button
            onClick={() => inputNumber('0')}
            className="col-span-2 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 rounded transition-colors border border-gray-300"
          >
            0
          </button>
          <button
            onClick={inputDecimal}
            className="bg-white hover:bg-gray-50 text-gray-800 font-semibold py-4 rounded transition-colors border border-gray-300"
          >
            .
          </button>
        </div>
      </div>
    </BaseApp>
  );
};
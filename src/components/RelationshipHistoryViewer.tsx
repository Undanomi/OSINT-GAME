"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useRelationshipHistory } from "@/hooks/useRelationshipHistory";
import { SocialAccount } from "@/types/social";

interface RelationshipHistoryViewerProps {
  contactId: string;
  contactName: string;
  accounts: SocialAccount[];
  initialAccountId?: string;
}

export const RelationshipHistoryViewer: React.FC<
  RelationshipHistoryViewerProps
> = ({ contactId, contactName, accounts, initialAccountId }) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    initialAccountId || accounts[0]?.id || "",
  );
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isHoveringChart, setIsHoveringChart] = useState<boolean>(false);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState<number>(500);

  // アカウントが切り替わった時に選択アカウントを更新
  useEffect(() => {
    if (initialAccountId) {
      setSelectedAccountId(initialAccountId);
    } else if (!selectedAccountId && accounts[0]) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [initialAccountId, accounts, selectedAccountId]);

  // 選択されたメッセージにスクロール
  useEffect(() => {
    if (selectedIndex !== null) {
      const element = messageRefs.current.get(selectedIndex);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedIndex]);

  // チャートの幅を取得
  useEffect(() => {
    const updateChartWidth = () => {
      if (chartContainerRef.current) {
        setChartWidth(chartContainerRef.current.offsetWidth);
      }
    };

    updateChartWidth();
    window.addEventListener("resize", updateChartWidth);
    return () => window.removeEventListener("resize", updateChartWidth);
  }, []);

  // 関係性履歴を取得（キャッシュ付き）
  const { history, loading, error } = useRelationshipHistory(
    selectedAccountId,
    contactId,
    50,
  );

  // ユーザーメッセージとNPCメッセージのペアを作成
  const {
    messagePairs,
    chartData,
    maxTrustIncreasePair,
    maxCautionIncreasePair,
  } = useMemo(() => {
    const pairs: Array<{
      pairIndex: number;
      userMessage: (typeof history)[0] | null;
      npcMessage: (typeof history)[0];
    }> = [];

    let pairIndexCounter = 0;
    for (let i = 0; i < history.length; i++) {
      if (history[i].sender === "npc") {
        const userMessage =
          i > 0 && history[i - 1].sender === "user" ? history[i - 1] : null;
        pairs.push({
          pairIndex: pairIndexCounter++,
          userMessage,
          npcMessage: history[i],
        });
      }
    }

    const chartData = pairs.map((pair, index) => {
      const currentDate = pair.npcMessage.timestamp.toLocaleDateString("ja-JP");
      const prevDate = index > 0 ? pairs[index - 1].npcMessage.timestamp.toLocaleDateString("ja-JP") : null;
      const showDate = index === 0 || currentDate !== prevDate;

      const timeStr = pair.npcMessage.timestamp.toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const displayTime = showDate
        ? `${pair.npcMessage.timestamp.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })} ${timeStr}`
        : timeStr;

      return {
        pairIndex: pair.pairIndex,
        time: displayTime,
        timestamp: pair.npcMessage.timestamp,
        信頼度: pair.npcMessage.trust,
        警戒度: pair.npcMessage.caution,
      };
    });

    const maxTrustIncreasePair = pairs
      .filter(
        (p) =>
          p.userMessage && p.npcMessage.trustDiff && p.npcMessage.trustDiff > 0,
      )
      .reduce(
        (max, p) =>
          p.npcMessage.trustDiff! > (max?.npcMessage.trustDiff || 0) ? p : max,
        null as (typeof pairs)[0] | null,
      );
    const maxCautionIncreasePair = pairs
      .filter(
        (p) =>
          p.userMessage &&
          p.npcMessage.cautionDiff &&
          p.npcMessage.cautionDiff > 0,
      )
      .reduce(
        (max, p) =>
          p.npcMessage.cautionDiff! > (max?.npcMessage.cautionDiff || 0)
            ? p
            : max,
        null as (typeof pairs)[0] | null,
      );

    return {
      messagePairs: pairs,
      chartData,
      maxTrustIncreasePair,
      maxCautionIncreasePair,
    };
  }, [history]);

  // 選択されたアカウントの情報を取得
  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);

  // アカウント切り替えハンドラ
  const handleAccountChange = (accountId: string) => {
    setSelectedAccountId(accountId);
    setSelectedIndex(null); // 選択をリセット
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center">
        <p className="text-gray-400">履歴を読み込み中...</p>
      </div>
    );
  }

  if (error || !selectedAccount) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-center">
        <p className="text-gray-400">
          {error || "アカウント情報が見つかりません"}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* アカウント切り替え */}
      {accounts.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => handleAccountChange(account.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedAccountId === account.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center text-xs">
                  {account.avatar}
                </span>
                <span>{account.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {history.length === 0 ? (
        <div className="bg-gray-900 rounded-lg p-6 flex-1 flex items-center justify-center">
          <p className="text-gray-400">
            {selectedAccount.name}と{contactName}の会話履歴がありません
          </p>
        </div>
      ) : (
        <>
          {/* 重要なメッセージの表示 */}
          {(maxCautionIncreasePair || maxTrustIncreasePair) && (
            <div className="text-left space-y-4 pb-4">
              {maxCautionIncreasePair && maxCautionIncreasePair.userMessage && (
                <div>
                  <h4 className="text-base font-bold text-white mb-2">
                    最も警戒度を上げたメッセージ{" "}
                    <span className="text-red-400">
                      (+{maxCautionIncreasePair.npcMessage.cautionDiff})
                    </span>
                  </h4>
                  <div className="bg-gray-900 rounded p-3 border-l-4 border-red-400">
                    <p className="text-base text-gray-300">
                      {maxCautionIncreasePair.userMessage.messageText}
                    </p>
                  </div>
                </div>
              )}
              {maxTrustIncreasePair && maxTrustIncreasePair.userMessage && (
                <div>
                  <h4 className="text-base font-bold text-white mb-2">
                    最も信頼度を上げたメッセージ{" "}
                    <span className="text-green-400">
                      (+{maxTrustIncreasePair.npcMessage.trustDiff})
                    </span>
                  </h4>
                  <div className="bg-gray-900 rounded p-3 border-l-4 border-green-400">
                    <p className="text-base text-gray-300">
                      {maxTrustIncreasePair.userMessage.messageText}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
            {/* 左側: 関係性グラフ */}
            <div className="bg-gray-800 rounded-lg p-4 flex flex-col min-h-0">
              <h3 className="text-lg font-semibold text-white mb-4">
                関係性グラフ
              </h3>
              <div ref={chartContainerRef} className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    onClick={(e) => {
                      if (
                        e &&
                        e.activeTooltipIndex != null &&
                        chartData[e.activeTooltipIndex]
                      ) {
                        const dataPoint = chartData[e.activeTooltipIndex];
                        setSelectedIndex(dataPoint.pairIndex);
                        setHoveredIndex(null);
                      }
                    }}
                    data={chartData}
                    onMouseMove={(e) => {
                      setIsHoveringChart(true);
                      if (
                        e.activeTooltipIndex != null &&
                        chartData[e.activeTooltipIndex]
                      ) {
                        const dataPoint = chartData[e.activeTooltipIndex];
                        setHoveredIndex(dataPoint.pairIndex);
                        setSelectedIndex(null);
                      }
                    }}
                    onMouseLeave={() => {
                      setIsHoveringChart(false);
                      setHoveredIndex(null);
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="pairIndex"
                      stroke="#9CA3AF"
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                      tickFormatter={(index) => {
                        const data = chartData.find(
                          (d) => d.pairIndex === index,
                        );
                        return data ? data.time : "";
                      }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#9CA3AF"
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
                    />

                    {/* Tooltipを制御 */}
                    <Tooltip
                      active={
                        isHoveringChart &&
                        (selectedIndex !== null || hoveredIndex !== null)
                      }
                      position={(() => {
                        const activeIndex =
                          selectedIndex !== null ? selectedIndex : hoveredIndex;
                        if (activeIndex === null || chartData.length === 0)
                          return undefined;

                        // グラフの実際の描画領域を考慮してx座標を計算
                        const leftMargin = 60; // Y軸のマージン
                        const rightMargin = 30;
                        const plotWidth = chartWidth - leftMargin - rightMargin;

                        const xPosition =
                          leftMargin +
                          (activeIndex / Math.max(chartData.length - 1, 1)) *
                            plotWidth;
                        const yPosition = 100; // 固定Y位置（グラフの上部）

                        return { x: xPosition, y: yPosition };
                      })()}
                      content={() => {
                        const activeIndex =
                          selectedIndex !== null ? selectedIndex : hoveredIndex;
                        if (activeIndex === null) return null;

                        const data = chartData.find(
                          (d) => d.pairIndex === activeIndex,
                        );
                        if (!data) return null;

                        return (
                          <div
                            style={{
                              backgroundColor: "#1F2937",
                              border: "1px solid #374151",
                              borderRadius: "0.5rem",
                              padding: "8px 12px",
                              color: "#F3F4F6",
                            }}
                          >
                            <p style={{ margin: "4px 0", fontSize: "14px" }}>
                              {data.time}
                            </p>
                            <p
                              style={{
                                margin: "4px 0",
                                color: "#10B981",
                                fontSize: "14px",
                              }}
                            >
                              信頼度: {data.信頼度}
                            </p>
                            <p
                              style={{
                                margin: "4px 0",
                                color: "#EF4444",
                                fontSize: "14px",
                              }}
                            >
                              警戒度: {data.警戒度}
                            </p>
                          </div>
                        );
                      }}
                      cursor={false}
                    />

                    {/* 選択/ホバー時の縦軸ハイライト */}
                    {(selectedIndex !== null || hoveredIndex !== null) &&
                      (() => {
                        const activeIndex =
                          selectedIndex !== null ? selectedIndex : hoveredIndex;
                        if (activeIndex === null) return null;
                        return (
                          <ReferenceLine
                            x={activeIndex}
                            stroke="#6B7280"
                            strokeWidth={2}
                          />
                        );
                      })()}

                    <Legend wrapperStyle={{ color: "#F3F4F6" }} />

                    <Line
                      type="monotone"
                      dataKey="信頼度"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: "#10B981", r: 4 }}
                      activeDot={false}
                      isAnimationActive={false}
                    />

                    <Line
                      type="monotone"
                      dataKey="警戒度"
                      stroke="#EF4444"
                      strokeWidth={2}
                      dot={{ fill: "#EF4444", r: 4 }}
                      activeDot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 右側: タイムラインビュー */}
            <div className="bg-gray-800 rounded-lg p-4 flex flex-col min-h-0">
              <h3 className="text-lg font-semibold text-white mb-4">
                会話タイムライン
              </h3>
              <div className="overflow-y-auto flex-1 min-h-0">
                {messagePairs.map((pair, index) => {
                  const isSelected =
                    selectedIndex === pair.pairIndex ||
                    hoveredIndex === pair.pairIndex;
                  const isWarning = pair.npcMessage.caution >= 80;

                  const currentDate = pair.npcMessage.timestamp.toLocaleDateString("ja-JP");
                  const prevDate = index > 0 ? messagePairs[index - 1].npcMessage.timestamp.toLocaleDateString("ja-JP") : null;
                  const showDate = index === 0 || currentDate !== prevDate;

                  const timeStr = pair.npcMessage.timestamp.toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const displayTime = showDate
                    ? `${pair.npcMessage.timestamp.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })} ${timeStr}`
                    : timeStr;

                  return (
                    <div
                      key={pair.pairIndex}
                      ref={(el) => {
                        if (el) messageRefs.current.set(pair.pairIndex, el);
                        else messageRefs.current.delete(pair.pairIndex);
                      }}
                      onMouseEnter={() => {
                        setHoveredIndex(pair.pairIndex);
                        setSelectedIndex(null);
                      }}
                      onMouseLeave={() => {
                        setHoveredIndex(null);
                      }}
                      onClick={() => {
                        setSelectedIndex(pair.pairIndex);
                        setHoveredIndex(null); // クリック時にホバー状態をリセット
                      }}
                      className="cursor-pointer"
                    >
                      <div
                        className={`p-1 rounded-lg transition-colors ${isSelected ? "bg-gray-700/50" : ""}`}
                      >
                        {/* 時刻と区切り線 */}
                        <div className="flex items-center gap-2 my-1">
                          <div className="flex-1 border-t border-gray-700"></div>
                          <span className="text-xs text-gray-500">
                            {displayTime}
                          </span>
                          <div className="flex-1 border-t border-gray-700"></div>
                        </div>
                        <div className="space-y-1">
                          {/* ユーザーメッセージ */}
                          {pair.userMessage && (
                            <div className="flex justify-end">
                              <div className="w-fit max-w-[80%] bg-blue-600 rounded-lg p-2 text-left">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs text-blue-200">
                                    {selectedAccount.name}
                                  </span>
                                </div>
                                <p className="text-sm text-white">
                                  {pair.userMessage.messageText}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* NPCメッセージ */}
                          <div className="flex justify-start">
                            <div className="w-fit max-w-[80%] bg-gray-600 rounded-lg p-2 text-left">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-gray-300">
                                  {contactName}
                                </span>
                              </div>
                              <p className="text-sm text-white">
                                {pair.npcMessage.messageText}
                              </p>
                            </div>
                          </div>

                          {/* 関係性の変化（中央揃え） */}
                          <div className="flex justify-center gap-4 text-xs py-1">
                            <span className="text-green-400">
                              信頼度: {pair.npcMessage.trust}
                              {pair.npcMessage.trustDiff !== undefined &&
                                pair.npcMessage.trustDiff !== 0 && (
                                  <span
                                    className={
                                      pair.npcMessage.trustDiff >= 0
                                        ? "text-green-400"
                                        : "text-red-400"
                                    }
                                  >
                                    {" "}
                                    ({pair.npcMessage.trustDiff >= 0 ? "+" : ""}
                                    {pair.npcMessage.trustDiff})
                                  </span>
                                )}
                            </span>
                            <span className="text-red-400">
                              警戒度: {pair.npcMessage.caution}
                              {pair.npcMessage.cautionDiff !== undefined &&
                                pair.npcMessage.cautionDiff !== 0 && (
                                  <span
                                    className={
                                      pair.npcMessage.cautionDiff >= 0
                                        ? "text-red-400"
                                        : "text-green-400"
                                    }
                                  >
                                    {" "}
                                    (
                                    {pair.npcMessage.cautionDiff >= 0
                                      ? "+"
                                      : ""}
                                    {pair.npcMessage.cautionDiff})
                                  </span>
                                )}
                            </span>
                            {isWarning && (
                              <span className="text-red-400">🔴</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

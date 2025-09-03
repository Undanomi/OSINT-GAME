/**
 * イントロダクションメッセージの設定
 * ゲーム開始時にNPCから送信される初期メッセージを定義
 */

export const INTRODUCTION_MESSAGES = {
  darkOrganization: {
    text: 'ようこそ。あなたが我々に興味を持ってくれたことを知っています。まずは簡単な質問から始めましょうか。何か知りたいことはありますか？',
    fallbackText: '接続に問題が発生しました。再度お試しください。'
  }
} as const;

/**
 * 指定されたNPCのイントロダクションメッセージを取得
 * @param npcType NPCの種類
 * @returns イントロダクションメッセージとフォールバックメッセージ
 */
export function getIntroductionMessage(npcType: keyof typeof INTRODUCTION_MESSAGES) {
  return INTRODUCTION_MESSAGES[npcType];
}
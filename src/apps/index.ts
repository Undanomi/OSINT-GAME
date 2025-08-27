/**
 * アプリケーションコンポーネントのエクスポートファイル
 * 
 * OSINTゲーム内で使用される各種アプリケーションコンポーネントを
 * 一元的にエクスポートするモジュール。
 * 
 * 各アプリケーションは独立したウィンドウとして動作し、
 * BaseAppコンポーネントをベースとしたUI構造を持つ。
 */

/** ブラウザアプリケーション - ウェブサイトの閲覧機能を提供 */
export { BrowserApp } from './BrowserApp';

/** ソーシャルメディアアプリケーション - SNS風の投稿・交流機能を提供 */
export { SocialApp } from './SocialApp';

/** メッセンジャーアプリケーション - NPCとのチャット機能を提供 */
export { MessengerApp } from './MessengerApp';

/** アプリストアアプリケーション - 利用可能なアプリの一覧・起動機能を提供 */
export { AppStoreApp } from './AppStoreApp';

/** 計算機アプリケーション - 基本的な計算機能を提供 */
export { CalculatorApp } from './CalculatorApp';
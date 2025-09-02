/**
 * メッセンジャーアプリの連絡先ドキュメント構造
 */
export interface MessengerContactDocument {
  id: string;
  name: string;
  type: string;
}

/**
 * デフォルトのメッセンジャー連絡先データ
 */
export const defaultMessengerContacts: MessengerContactDocument[] = [
  {
    id: 'dark_organization',
    name: '闇の組織',
    type: 'darkOrganization'
  }
];

'use client';

import { create } from 'zustand';
import {
  UISocialPost,
  SocialContact,
  UISocialDMMessage,
  SocialNPC,
  SocialAccount,
  SocialStore as SocialStoreType,
  RelationshipHistoryWithMessage
} from '@/types/social';

interface SocialStore extends SocialStoreType {
  // アクション
  setTimeline: (posts: UISocialPost[], hasMore: boolean) => void;
  appendTimeline: (posts: UISocialPost[], hasMore: boolean) => void;
  setAccountPosts: (accountId: string, posts: UISocialPost[], hasMore: boolean) => void;
  appendAccountPosts: (accountId: string, posts: UISocialPost[], hasMore: boolean) => void;
  setNPCPosts: (npcId: string, posts: UISocialPost[], hasMore: boolean) => void;
  appendNPCPosts: (npcId: string, posts: UISocialPost[], hasMore: boolean) => void;
  setAccounts: (accounts: SocialAccount[]) => void;
  setNPCs: (npcs: SocialNPC[]) => void;
  setSocialNPCPosts: (posts: UISocialPost[], hasMore: boolean) => void;
  appendSocialNPCPosts: (posts: UISocialPost[], hasMore: boolean) => void;
  setContacts: (accountId: string, contacts: SocialContact[]) => void;
  setMessages: (accountId: string, contactId: string, messages: UISocialDMMessage[], hasMore: boolean) => void;
  appendMessages: (accountId: string, contactId: string, messages: UISocialDMMessage[], hasMore: boolean) => void;
  addMessage: (accountId: string, contactId: string, message: UISocialDMMessage) => void;
  setRelationshipHistory: (accountId: string, contactId: string, history: RelationshipHistoryWithMessage[]) => void;

  // ユーティリティ
  clearAllData: () => void;
  clearAccountData: (accountId: string) => void;
  getCurrentTimestamp: () => number;
}


export const useSocialStore = create<SocialStore>()((set) => ({
      // 初期状態
      timeline: null,
      accountPosts: {},
      npcPosts: {},
      accounts: null,
      npcs: null,
      socialNPCPosts: null,
      contacts: {},
      messages: {},
      relationshipHistories: {},

      // タイムライン管理
      setTimeline: (posts, hasMore) => {
        set(() => {
          // 重複を除去（IDベース）
          const uniquePosts = posts.filter((post, index, self) =>
            index === self.findIndex(p => p.id === post.id)
          );

          return {
            timeline: {
              posts: uniquePosts,
              hasMore,
              timestamp: Date.now()
            }
          };
        });
      },

      appendTimeline: (posts, hasMore) => {
        set((state) => {
          const existing = state.timeline;
          const existingPosts = existing ? existing.posts : [];
          const combinedPosts = [...existingPosts, ...posts];

          // 重複を除去（IDベース）
          const uniquePosts = combinedPosts.filter((post, index, self) =>
            index === self.findIndex(p => p.id === post.id)
          );

          return {
            timeline: {
              posts: uniquePosts,
              hasMore,
              timestamp: Date.now()
            }
          };
        });
      },

      // アカウント投稿管理
      setAccountPosts: (accountId, posts, hasMore) => {
        set((state) => ({
          accountPosts: {
            ...state.accountPosts,
            [accountId]: {
              accountId,
              posts,
              hasMore,
              timestamp: Date.now()
            }
          }
        }));
      },

      appendAccountPosts: (accountId, posts, hasMore) => {
        set((state) => {
          const existing = state.accountPosts[accountId];
          return {
            accountPosts: {
              ...state.accountPosts,
              [accountId]: {
                accountId,
                posts: existing ? [...existing.posts, ...posts] : posts,
                hasMore,
                timestamp: Date.now()
              }
            }
          };
        });
      },

      // NPC投稿管理
      setNPCPosts: (npcId, posts, hasMore) => {
        set((state) => ({
          npcPosts: {
            ...state.npcPosts,
            [npcId]: {
              npcId,
              posts,
              hasMore,
              timestamp: Date.now()
            }
          }
        }));
      },

      appendNPCPosts: (npcId, posts, hasMore) => {
        set((state) => {
          const existing = state.npcPosts[npcId];
          return {
            npcPosts: {
              ...state.npcPosts,
              [npcId]: {
                npcId,
                posts: existing ? [...existing.posts, ...posts] : posts,
                hasMore,
                timestamp: Date.now()
              }
            }
          };
        });
      },

      // アカウント管理
      setAccounts: (accounts) => {
        set({
          accounts: {
            accounts,
            timestamp: Date.now()
          }
        });
      },

      // NPC管理
      setNPCs: (npcs) => {
        set({
          npcs: {
            npcs,
            timestamp: Date.now()
          }
        });
      },

      // 統合NPC投稿管理
      setSocialNPCPosts: (posts, hasMore) => {
        set({
          socialNPCPosts: {
            posts,
            hasMore,
            timestamp: Date.now()
          }
        });
      },

      appendSocialNPCPosts: (posts, hasMore) => {
        set((state) => {
          const existing = state.socialNPCPosts;
          return {
            socialNPCPosts: {
              posts: existing ? [...existing.posts, ...posts] : posts,
              hasMore,
              timestamp: Date.now()
            }
          };
        });
      },

      // 連絡先管理
      setContacts: (accountId, contacts) => {
        set((state) => ({
          contacts: {
            ...state.contacts,
            [accountId]: {
              contacts,
              timestamp: Date.now()
            }
          }
        }));
      },

      // メッセージ管理
      setMessages: (accountId, contactId, messages, hasMore) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [`${accountId}_${contactId}`]: {
              messages,
              hasMore,
              timestamp: Date.now()
            }
          }
        }));
      },

      appendMessages: (accountId, contactId, messages, hasMore) => {
        set((state) => {
          const key = `${accountId}_${contactId}`;
          const existing = state.messages[key];
          return {
            messages: {
              ...state.messages,
              [key]: {
                messages: existing ? [...messages, ...existing.messages] : messages,
                hasMore,
                timestamp: Date.now()
              }
            }
          };
        });
      },

      addMessage: (accountId, contactId, message) => {
        set((state) => {
          const key = `${accountId}_${contactId}`;
          const existing = state.messages[key];
          return {
            messages: {
              ...state.messages,
              [key]: {
                messages: existing ? [...existing.messages, message] : [message],
                hasMore: existing?.hasMore ?? true,
                timestamp: Date.now()
              }
            }
          };
        });
      },

      // 関係性履歴管理
      setRelationshipHistory: (accountId, contactId, history) => {
        set((state) => ({
          relationshipHistories: {
            ...state.relationshipHistories,
            [`${accountId}_${contactId}`]: {
              history,
              timestamp: Date.now()
            }
          }
        }));
      },

      // ユーティリティ
      clearAllData: () => {
        set({
          timeline: null,
          accountPosts: {},
          npcPosts: {},
          accounts: null,
          npcs: null,
          socialNPCPosts: null,
          contacts: {},
          messages: {},
          relationshipHistories: {},
        });
      },

      clearAccountData: (accountId) => {
        set((state) => {
          const newState = { ...state };

          // アカウント固有のデータを削除
          delete newState.accountPosts[accountId];

          // 連絡先とメッセージと関係性履歴からアカウント関連のキーを削除
          Object.keys(newState.contacts).forEach(key => {
            if (key === accountId) {
              delete newState.contacts[key];
            }
          });

          Object.keys(newState.messages).forEach(key => {
            if (key.startsWith(`${accountId}_`)) {
              delete newState.messages[key];
            }
          });

          Object.keys(newState.relationshipHistories).forEach(key => {
            if (key.startsWith(`${accountId}_`)) {
              delete newState.relationshipHistories[key];
            }
          });

          return newState;
        });
      },

      getCurrentTimestamp: () => Date.now(),
    }));
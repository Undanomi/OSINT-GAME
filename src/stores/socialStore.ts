'use client';

import { create } from 'zustand';
import {
  UISocialPost,
  SocialContact,
  UISocialDMMessage,
  SocialNPC,
  SocialAccount,
  SocialStore as SocialStoreType
} from '@/types/social';

interface SocialStore extends SocialStoreType {
  // アクション
  setUserTimeline: (userId: string, posts: UISocialPost[], hasMore: boolean) => void;
  appendUserTimeline: (userId: string, posts: UISocialPost[], hasMore: boolean) => void;
  setAccountPosts: (userId: string, accountId: string, posts: UISocialPost[], hasMore: boolean) => void;
  appendAccountPosts: (userId: string, accountId: string, posts: UISocialPost[], hasMore: boolean) => void;
  setNPCPosts: (npcId: string, posts: UISocialPost[], hasMore: boolean) => void;
  appendNPCPosts: (npcId: string, posts: UISocialPost[], hasMore: boolean) => void;
  setUserAccounts: (userId: string, accounts: SocialAccount[]) => void;
  setNPCs: (npcs: SocialNPC[]) => void;
  setSocialNPCPosts: (posts: UISocialPost[], hasMore: boolean) => void;
  appendSocialNPCPosts: (posts: UISocialPost[], hasMore: boolean) => void;
  setUserContacts: (userId: string, accountId: string, contacts: SocialContact[]) => void;
  setUserMessages: (userId: string, accountId: string, contactId: string, messages: UISocialDMMessage[], hasMore: boolean) => void;
  appendUserMessages: (userId: string, accountId: string, contactId: string, messages: UISocialDMMessage[], hasMore: boolean) => void;
  addUserMessage: (userId: string, accountId: string, contactId: string, message: UISocialDMMessage) => void;


  // ユーティリティ
  clearUserData: (userId: string) => void;
  clearAccountData: (userId: string, accountId: string) => void;
  getCurrentTimestamp: () => number;
}


export const useSocialStore = create<SocialStore>()((set) => ({
      // 初期状態
      timeline: {},
      accountPosts: {},
      npcPosts: {},
      accounts: {},
      npcs: null,
      socialNPCPosts: null,
      contacts: {},
      messages: {},

      // タイムライン管理
      setUserTimeline: (userId, posts, hasMore) => {
        set((state) => {
          // 重複を除去（IDベース）
          const uniquePosts = posts.filter((post, index, self) =>
            index === self.findIndex(p => p.id === post.id)
          );

          return {
            timeline: {
              ...state.timeline,
              [userId]: {
                posts: uniquePosts,
                hasMore,
                timestamp: Date.now()
              }
            }
          };
        });
      },

      appendUserTimeline: (userId, posts, hasMore) => {
        set((state) => {
          const existing = state.timeline[userId];
          const existingPosts = existing ? existing.posts : [];
          const combinedPosts = [...existingPosts, ...posts];

          // 重複を除去（IDベース）
          const uniquePosts = combinedPosts.filter((post, index, self) =>
            index === self.findIndex(p => p.id === post.id)
          );

          return {
            timeline: {
              ...state.timeline,
              [userId]: {
                posts: uniquePosts,
                hasMore,
                timestamp: Date.now()
              }
            }
          };
        });
      },

      // アカウント投稿管理
      setAccountPosts: (userId, accountId, posts, hasMore) => {
        set((state) => ({
          accountPosts: {
            ...state.accountPosts,
            [userId]: {
              ...state.accountPosts[userId],
              [accountId]: {
                userId,
                accountId,
                posts,
                hasMore,
                timestamp: Date.now()
              }
            }
          }
        }));
      },

      appendAccountPosts: (userId, accountId, posts, hasMore) => {
        set((state) => {
          const existing = state.accountPosts[userId]?.[accountId];
          return {
            accountPosts: {
              ...state.accountPosts,
              [userId]: {
                ...state.accountPosts[userId],
                [accountId]: {
                  userId,
                  accountId,
                  posts: existing ? [...existing.posts, ...posts] : posts,
                  hasMore,
                  timestamp: Date.now()
                }
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
      setUserAccounts: (userId, accounts) => {
        set((state) => ({
          accounts: {
            ...state.accounts,
            [userId]: {
              accounts,
              timestamp: Date.now()
            }
          }
        }));
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
      setUserContacts: (userId, accountId, contacts) => {
        set((state) => ({
          contacts: {
            ...state.contacts,
            [`${userId}_${accountId}`]: {
              contacts,
              timestamp: Date.now()
            }
          }
        }));
      },

      // メッセージ管理
      setUserMessages: (userId, accountId, contactId, messages, hasMore) => {
        set((state) => ({
          messages: {
            ...state.messages,
            [`${userId}_${accountId}_${contactId}`]: {
              messages,
              hasMore,
              timestamp: Date.now()
            }
          }
        }));
      },

      appendUserMessages: (userId, accountId, contactId, messages, hasMore) => {
        set((state) => {
          const key = `${userId}_${accountId}_${contactId}`;
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

      addUserMessage: (userId, accountId, contactId, message) => {
        set((state) => {
          const key = `${userId}_${accountId}_${contactId}`;
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


      // ユーティリティ
      clearUserData: (userId) => {
        set((state) => {
          const newState = { ...state };

          // ユーザー固有のデータを削除
          delete newState.timeline[userId];
          delete newState.accountPosts[userId];
          delete newState.accounts[userId];

          // 連絡先とメッセージからユーザー関連のキーを削除
          Object.keys(newState.contacts).forEach(key => {
            if (key.startsWith(`${userId}_`)) {
              delete newState.contacts[key];
            }
          });

          Object.keys(newState.messages).forEach(key => {
            if (key.startsWith(`${userId}_`)) {
              delete newState.messages[key];
            }
          });

          return newState;
        });
      },

      clearAccountData: (userId, accountId) => {
        set((state) => {
          const newState = { ...state };

          // アカウント固有のデータを削除
          if (newState.accountPosts[userId]) {
            delete newState.accountPosts[userId][accountId];
          }

          // 連絡先とメッセージからアカウント関連のキーを削除
          Object.keys(newState.contacts).forEach(key => {
            if (key.startsWith(`${userId}_${accountId}`)) {
              delete newState.contacts[key];
            }
          });

          Object.keys(newState.messages).forEach(key => {
            if (key.startsWith(`${userId}_${accountId}`)) {
              delete newState.messages[key];
            }
          });

          return newState;
        });
      },

      getCurrentTimestamp: () => Date.now(),
    }));
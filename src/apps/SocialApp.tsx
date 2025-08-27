import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { BaseApp } from '@/components/BaseApp';
import { AppProps } from '@/types/app';
import { GoogleGenerativeAI, Content } from '@google/generative-ai';

import { Heart, MessageCircle, Share, MoreHorizontal, User, MapPin, Calendar, Briefcase, GraduationCap, Home, Search, Settings, UserCircle, Mail, ArrowLeft, Gift, PlusSquare } from 'lucide-react';


// --- Gemini AI設定 ---

/** Google Generative AI インスタンス - Gemini APIクライアント */
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

/**
 * Gemini AI モデルの設定
 * チャット履歴のみに基づいて応答するように設定
 */
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

// --- データ型定義 ---

/**
 * ユーザープロフィールの情報を格納するインターフェース
 */
interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  location: string;
  joinDate: string;
  company?: string;
  position?: string;
  education?: string;
  birthday?: string;
  followersCount: number;
  followingCount: number;
  canDM: boolean;
}

/**
 * SNSの投稿情報を格納するインターフェース
 */
interface Post {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  location?: string;
}

/**
 * ユーザーデータの初期値
 */
const initialUsers: UserProfile[] = [
  {
    id: 'user1',
    name: '田中太郎',
    username: '@tanaka_taro',
    avatar: 'T',
    bio: 'ABC株式会社 マーケティング部長 | デジタル戦略とブランドマーケティングの専門家。',
    location: '東京, 日本',
    joinDate: '2019年3月',
    company: 'ABC株式会社',
    position: 'マーケティング部長',
    education: '東京大学 経済学部',
    birthday: '8月10日',
    followersCount: 1205,
    followingCount: 324,
    canDM: true,
  },
  {
    id: 'user2',
    name: '鈴木花子',
    username: '@suzuki_hanako',
    avatar: 'H',
    bio: 'フリーランスのUI/UXデザイナー。シンプルで使いやすいデザインを追求しています。',
    location: '大阪, 日本',
    joinDate: '2020年5月',
    education: '京都芸術大学',
    followersCount: 850,
    followingCount: 210,
    canDM: true,
  },
  {
    id: 'user3',
    name: '佐藤健太',
    username: '@sato_kenta_dev',
    avatar: 'K',
    bio: 'Webデベロッパー。ReactとTypeScriptが好き。趣味は登山とコーヒー。',
    location: '福岡, 日本',
    joinDate: '2018年11月',
    company: 'Tech Startup Inc.',
    position: 'フロントエンドエンジニア',
    followersCount: 1500,
    followingCount: 500,
    canDM: false,
  },
];

/**
 * ★変更点: 投稿データの初期値を定義
 */
const initialPosts: Post[] = [
    {
    id: 'p1',
    userId: 'user1',
    content: '今日はABC Cloud Proのローンチイベントでした！チーム全員での3ヶ月の努力が実を結び、素晴らしいプロダクトができました。 #プロダクトローンチ',
    timestamp: '2時間前',
    likes: 45,
    comments: 12,
    shares: 8,
    location: '東京, 日本'
  },
  {
    id: 'p3',
    userId: 'user2',
    content: '新しいポートフォリオサイトを公開しました！ぜひご覧ください。フィードバックお待ちしています。 #uidesign #uxdesign',
    timestamp: '8時間前',
    likes: 120,
    comments: 35,
    shares: 20
  },
  {
    id: 'p4',
    userId: 'user3',
    content: 'Reactの新しいバージョン、パフォーマンスがかなり改善されてるみたい。早速個人プロジェクトで試してみよう。 #react #frontend',
    timestamp: '1日前',
    likes: 98,
    comments: 22,
    shares: 15
  },
];


/**
 * 個別の投稿を表示するコンポーネント
 */
const PostComponent = ({ post, author, onUserSelect }: { post: Post, author: UserProfile | undefined, onUserSelect: (userId: string) => void }) => {
  if (!author) return null;
  const handleAuthorClick = () => onUserSelect(author.id);

  return (
    <div className="bg-white p-6 border-b border-gray-200">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 text-gray-600 font-bold cursor-pointer hover:opacity-80" onClick={handleAuthorClick}>
          {author.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900 cursor-pointer hover:underline" onClick={handleAuthorClick}>
              {author.name}
            </h3>
            <span className="text-gray-500 text-sm">{author.username}</span>
            <span className="text-gray-500 text-sm">•</span>
            <span className="text-gray-500 text-sm">{post.timestamp}</span>
          </div>
          <p className="mt-2 text-gray-800 leading-relaxed">{post.content}</p>
          <div className="flex items-center justify-between mt-4 max-w-md">
            <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600"><Heart size={18} /> <span className="text-sm">{post.likes}</span></button>
            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600"><MessageCircle size={18} /> <span className="text-sm">{post.comments}</span></button>
            <button className="flex items-center space-x-2 text-gray-500 hover:text-green-600"><Share size={18} /> <span className="text-sm">{post.shares}</span></button>
            <button className="text-gray-500 hover:text-gray-700"><MoreHorizontal size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * ユーザープロフィールページコンポーネント
 */
const ProfilePage = ({ user, userPosts, onStartDM, isMyProfile, onUserSelect }: { user: UserProfile, userPosts: Post[], onStartDM: (user: UserProfile) => void, isMyProfile: boolean, onUserSelect: (userId: string) => void }) => {
  return (
    <div>
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-2xl font-bold">{user.avatar}</div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
              <p className="text-gray-600">{user.username}</p>
              <p className="text-sm text-gray-700 mt-2 max-w-md leading-relaxed">{user.bio}</p>
            </div>
          </div>
          {!isMyProfile && (
            <button onClick={() => onStartDM(user)} disabled={!user.canDM} className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed">
              <Mail size={20} />
            </button>
          )}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-gray-600"><MapPin size={14} /><span>{user.location}</span></div>
            <div className="flex items-center space-x-2 text-gray-600"><Calendar size={14} /><span>参加日: {user.joinDate}</span></div>
            {user.birthday && (<div className="flex items-center space-x-2 text-gray-600"><Gift size={14} /><span>誕生日: {user.birthday}</span></div>)}
            {user.company && (<div className="flex items-center space-x-2 text-gray-600"><Briefcase size={14} /><span>{user.company} - {user.position}</span></div>)}
          </div>
          <div className="space-y-2">
            {user.education && (<div className="flex items-center space-x-2 text-gray-600"><GraduationCap size={14} /><span>{user.education}</span></div>)}
            <div className="flex space-x-6 text-sm"><span><strong>{user.followingCount}</strong> フォロー</span><span><strong>{user.followersCount}</strong> フォロワー</span></div>
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-200">
        <h3 className="p-4 font-bold text-lg">投稿一覧</h3>
        {userPosts.length > 0 ? (userPosts.map(post => <PostComponent key={post.id} post={post} author={user} onUserSelect={onUserSelect}/>)) : (<p className="p-6 text-gray-500">まだ投稿がありません。</p>)}
      </div>
    </div>
  );
};

/**
 * 検索機能を提供するページコンポーネント
 */
const SearchPage = ({ users, posts, onUserSelect }: { users: UserProfile[], posts: Post[], onUserSelect: (userId: string) => void }) => {
    const [query, setQuery] = useState('');
    const filteredUsers = useMemo(() => query ? users.filter(u => u.name.toLowerCase().includes(query.toLowerCase()) || u.username.toLowerCase().includes(query.toLowerCase())) : [], [query, users]);
    const filteredPosts = useMemo(() => query ? posts.filter(p => p.content.toLowerCase().includes(query.toLowerCase())) : [], [query, posts]);
    return (
        <div className="p-4">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="text" placeholder="ユーザーや投稿を検索" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div className="mt-6">{query && (<>{filteredUsers.length > 0 && (<div className="mb-6"><h3 className="font-bold text-lg mb-2">ユーザー</h3><div className="space-y-2">{filteredUsers.map(user => (<div key={user.id} onClick={() => onUserSelect(user.id)} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer"><div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-bold">{user.avatar}</div><div><p className="font-semibold">{user.name}</p><p className="text-sm text-gray-500">{user.username}</p></div></div>))}</div></div>)}{filteredPosts.length > 0 && (<div><h3 className="font-bold text-lg mb-2">投稿</h3><div className="divide-y divide-gray-200">{filteredPosts.map(post => (<PostComponent key={post.id} post={post} author={users.find(u => u.id === post.userId)} onUserSelect={onUserSelect} />))}</div></div>)}{filteredUsers.length === 0 && filteredPosts.length === 0 && (<p className="text-center text-gray-500 mt-8">「{query}」に一致する結果は見つかりませんでした。</p>)}</>)}</div>
        </div>
    );
};

// ... (DMContactListPage, DMChatPage コンポーネントは変更なし)
const DMContactListPage = ({ contacts, onSelectContact }: { contacts: any[], onSelectContact: (contact: any) => void }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const filteredContacts = useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();
    if (!lowercasedQuery) return contacts;
    return contacts.filter(contact =>
      contact.name.toLowerCase().includes(lowercasedQuery)
    );
  }, [contacts, searchQuery]);
  return (<div className="h-full bg-white flex flex-col"><div className="p-4 border-b"><h2 className="text-xl font-bold">メッセージ</h2></div><div className="p-3 border-b"><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="連絡先を検索" className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div></div><div className="flex-1 overflow-y-auto">{filteredContacts.length > 0 ? (filteredContacts.map((contact) => (<div key={contact.id} className="flex items-center space-x-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100" onClick={() => onSelectContact(contact)}><div className="relative w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0"><User size={20} className="text-gray-600" />{contact.status === 'online' && (<span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-white border-2"></span>)}</div><div className="flex-1 min-w-0"><div className="flex justify-between items-center"><h3 className="font-semibold text-gray-800 truncate">{contact.name}</h3><span className="text-xs text-gray-500">{contact.lastTime}</span></div><p className="text-sm text-gray-500 truncate mt-1">{contact.lastMessage}</p></div></div>))) : (<div className="p-6 text-center"><p className="text-gray-500">{searchQuery ? `「${searchQuery}」に一致する連絡先は見つかりませんでした。` : "連絡先がありません。"}</p></div>)}</div></div>);
};
const DMChatPage = ({ contact, onBack }: { contact: any, onBack: () => void }) => {
  const [messages, setMessages] = useState<{ [contactId: string]: Array<{id: string, sender: 'me' | 'other', text: string, time: string}> }>({});
  const [inputText, setInputText] = useState('');
  const [chatHistory, setChatHistory] = useState<Content[]>([]);
  const currentMessages = messages[contact.id] || [];
  const handleSendMessage = useCallback(async () => { if (!inputText.trim()) return; const userMessage = { id: `m${contact.id}-${currentMessages.length + 1}`, sender: 'me' as const, text: inputText, time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),}; setMessages(prev => ({ ...prev, [contact.id]: [...(prev[contact.id] || []), userMessage] })); const currentInput = inputText; setInputText(''); try { const chat = model.startChat({ history: chatHistory }); const result = await chat.sendMessage(currentInput); const responseText = result.response.text(); const aiMessage = { id: `m${contact.id}-${currentMessages.length + 2}`, sender: 'other' as const, text: responseText, time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }), }; setMessages(prev => ({ ...prev, [contact.id]: [...(prev[contact.id] || []), aiMessage] })); setChatHistory(prevHistory => [ ...prevHistory, { role: 'user', parts: [{ text: currentInput }] }, { role: 'model', parts: [{ text: responseText }] } ]); } catch (error) { console.error("AI API call failed:", error); const errorMessage = { id: `m${contact.id}-${currentMessages.length + 2}`, sender: 'other' as const, text: 'エラーが発生しました。応答を生成できませんでした。', time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }), }; setMessages(prev => ({ ...prev, [contact.id]: [...(prev[contact.id] || []), errorMessage] })); } }, [inputText, contact, currentMessages, chatHistory]);
  return (<div className="h-full flex flex-col bg-white"><div className="flex items-center p-4 bg-white border-b"><button onClick={onBack} className="mr-3 p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} className="text-gray-600" /></button><div className="flex items-center space-x-3"><div className="relative w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center"><User size={16} className="text-gray-600" />{contact.status === 'online' && (<span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-white border-2"></span>)}</div><div><h3 className="font-semibold text-gray-800">{contact.name}</h3><p className="text-xs text-gray-500">{contact.status === 'online' ? 'オンライン' : 'オフライン'}</p></div></div></div><div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">{currentMessages.map((message) => (<div key={message.id} className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-md p-3 rounded-lg shadow-sm text-sm ${ message.sender === 'me' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none' }`}><p className="whitespace-pre-wrap">{message.text}</p><p className={`text-xs mt-1 text-right ${ message.sender === 'me' ? 'text-blue-200' : 'text-gray-500' }`}>{message.time}</p></div></div>))}</div><div className="flex-shrink-0 p-4 border-t bg-white"><div className="flex items-center space-x-3"><input type="text" placeholder="メッセージを入力..." className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} /><button onClick={handleSendMessage} className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 disabled:bg-blue-300" disabled={!inputText.trim()}><MessageCircle size={20} /></button></div></div></div>);
};

/**
 * 設定ページコンポーネント
 */
const MorePage = ({ onNavigateToEdit }: { onNavigateToEdit: () => void }) => {
  return (<div className="p-6"><h2 className="text-xl font-bold mb-4">設定</h2><div className="space-y-2"><button onClick={onNavigateToEdit} className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-100 border">アカウント設定</button><button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-100 border">プライバシーポリシー</button><button className="w-full text-left p-3 bg-white rounded-lg hover:bg-gray-100 border">ログアウト</button></div></div>);
};

/**
 * プロフィール編集ページコンポーネント
 */
const ProfileEditPage = ({ user, onSave, onCancel }: { user: UserProfile, onSave: (updatedUser: UserProfile) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState(user);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const { name, value } = e.target; setFormData(prev => ({...prev, [name]: value})); };
    return (<div className="h-full flex flex-col"><div className="flex items-center p-4 bg-white border-b flex-shrink-0"><button onClick={onCancel} className="mr-3 p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} className="text-gray-600" /></button><h2 className="text-xl font-bold">プロフィールを編集</h2></div><div className="flex-1 overflow-y-auto p-6 space-y-4"><div><label className="text-sm font-medium text-gray-700">名前</label><input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"/></div><div><label className="text-sm font-medium text-gray-700">自己紹介</label><textarea name="bio" value={formData.bio} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"/></div><div><label className="text-sm font-medium text-gray-700">誕生日</label><input type="text" name="birthday" value={formData.birthday || ''} onChange={handleChange} placeholder="例: 8月10日" className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"/></div><div><label className="text-sm font-medium text-gray-700">所在地</label><input type="text" name="location" value={formData.location} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"/></div><div><label className="text-sm font-medium text-gray-700">会社</label><input type="text" name="company" value={formData.company || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"/></div><div><label className="text-sm font-medium text-gray-700">役職</label><input type="text" name="position" value={formData.position || ''} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"/></div></div><div className="p-4 border-t bg-white"><button onClick={() => onSave(formData)} className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600">保存</button></div></div>);
};

/**
 * ★追加: 新規投稿ページコンポーネント
 */
const NewPostPage = ({ currentUser, onAddPost, onCancel }: { currentUser: UserProfile, onAddPost: (content: string) => void, onCancel: () => void }) => {
    const [content, setContent] = useState('');
    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 bg-white border-b flex-shrink-0">
                <button onClick={onCancel} className="text-blue-500 hover:text-blue-700">キャンセル</button>
                <button onClick={() => onAddPost(content)} disabled={!content.trim()} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-full hover:bg-blue-600 disabled:bg-blue-300">投稿</button>
            </div>
            <div className="flex-1 p-4 flex space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 text-gray-600 font-bold">{currentUser.avatar}</div>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="いまどうしてる？"
                    className="w-full h-full resize-none border-none focus:outline-none text-lg"
                />
            </div>
        </div>
    );
};

/**
 * SNSアプリで表示可能なビューの種類を定義
 */
type View = 'home' | 'search' | 'new-post' | 'dm' | 'dm-chat' | 'profile' | 'my-profile' | 'more' | 'edit-profile';

/**
 * SNSアプリケーションのメインコンポーネント
 */
export const SocialApp: React.FC<AppProps> = ({ windowId, isActive }) => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  // ★変更点: 投稿データをstateで管理
  const [posts, setPosts] = useState<Post[]>(initialPosts);

  const currentUser = users.find(u => u.id === 'user1')!;

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setCurrentView(userId === currentUser.id ? 'my-profile' : 'profile');
  };

  const handleContactSelect = (contact: any) => { setSelectedContact(contact); setCurrentView('dm-chat'); };
  const handleBackToDMList = () => { setSelectedContact(null); setCurrentView('dm'); };

  const handleStartDM = (userToDM: UserProfile) => {
    let contact = contacts.find(c => c.id === userToDM.id);
    if (!contact) {
      contact = { id: userToDM.id, name: userToDM.name, status: 'online', lastMessage: '', lastTime: '' };
      setContacts(prev => [...prev, contact!]);
    }
    setSelectedContact(contact);
    setCurrentView('dm-chat');
  };

  const handleProfileUpdate = (updatedUser: UserProfile) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      setCurrentView('my-profile');
  };

  /**
   * ★追加: 新規投稿処理
   */
  const handleAddNewPost = (content: string) => {
      if (!content.trim()) return;
      const newPost: Post = {
          id: `p${Date.now()}`,
          userId: currentUser.id,
          content,
          timestamp: 'たった今',
          likes: 0,
          comments: 0,
          shares: 0,
      };
      setPosts(prevPosts => [newPost, ...prevPosts]);
      setCurrentView('home');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <div className="divide-y divide-gray-200">{posts.map(p => <PostComponent key={p.id} post={p} author={users.find(u => u.id === p.userId)} onUserSelect={handleUserSelect}/>)}</div>;
      case 'search':
        return <SearchPage users={users} posts={posts} onUserSelect={handleUserSelect} />;
      case 'profile':
        const selectedUser = users.find(u => u.id === selectedUserId);
        return selectedUser ? <ProfilePage user={selectedUser} userPosts={posts.filter(p => p.userId === selectedUserId)} onStartDM={handleStartDM} isMyProfile={false} onUserSelect={handleUserSelect}/> : <p>ユーザーが見つかりません。</p>;
      case 'my-profile':
        return <ProfilePage user={currentUser} userPosts={posts.filter(p => p.userId === currentUser.id)} onStartDM={handleStartDM} isMyProfile={true} onUserSelect={handleUserSelect} />;
      case 'dm':
        return <DMContactListPage contacts={contacts} onSelectContact={handleContactSelect} />;
      case 'dm-chat':
        return selectedContact ? <DMChatPage contact={selectedContact} onBack={handleBackToDMList} /> : <div>連絡先が選択されていません。</div>;
      case 'more':
        return <MorePage onNavigateToEdit={() => setCurrentView('edit-profile')} />;
      case 'edit-profile':
        return <ProfileEditPage user={currentUser} onSave={handleProfileUpdate} onCancel={() => setCurrentView('more')} />;
      // ★追加: 新規投稿画面の表示
      case 'new-post':
        return <NewPostPage currentUser={currentUser} onAddPost={handleAddNewPost} onCancel={() => setCurrentView('home')} />;
      default:
        return <div>ホーム</div>;
    }
  };

  return (
    <BaseApp windowId={windowId} isActive={isActive} statusBar="SNSアプリケーション">
    <div className="h-full bg-gray-50 flex flex-col">
      <div className="flex-1 overflow-auto">{renderContent()}</div>
      <div className="h-16 bg-white border-t flex justify-around items-center flex-shrink-0">
        <button onClick={() => setCurrentView('home')} className={`p-2 rounded-full transition-colors ${currentView === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}><Home size={24} /></button>
        <button onClick={() => setCurrentView('search')} className={`p-2 rounded-full transition-colors ${currentView === 'search' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}><Search size={24} /></button>
        {/* ★変更点: 新規投稿タブを追加 */}
        <button onClick={() => setCurrentView('new-post')} className={`p-2 rounded-full transition-colors ${currentView === 'new-post' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}><PlusSquare size={24} /></button>
        <button onClick={() => setCurrentView('dm')} className={`p-2 rounded-full transition-colors ${currentView === 'dm' || currentView === 'dm-chat' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}><Mail size={24} /></button>
        <button onClick={() => setCurrentView('my-profile')} className={`p-2 rounded-full transition-colors ${currentView === 'my-profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}><UserCircle size={24} /></button>
        <button onClick={() => setCurrentView('more')} className={`p-2 rounded-full transition-colors ${currentView === 'more' || currentView === 'edit-profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}><Settings size={24} /></button>
      </div>
    </div>
  </BaseApp>
  );
};

export default SocialApp;
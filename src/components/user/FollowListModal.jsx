import React, { useState, useEffect } from 'react';
import { X, Search, UserCheck, UserPlus, Shield, UserX, Loader2 } from 'lucide-react';

export const FollowListModal = ({ 
  isOpen, 
  onClose, 
  targetUsername, 
  initialTab = 'followers', // 'followers' | 'following'
  currentUsername,
  onRelationshipChanged
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen && targetUsername) {
      loadData();
    }
  }, [isOpen, targetUsername]);

  const loadData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const [followersRes, followingRes] = await Promise.all([
        fetch(`/api/follows/${targetUsername}/followers`, { headers }),
        fetch(`/api/follows/${targetUsername}/following`, { headers })
      ]);

      if (followersRes.ok) {
        const data = await followersRes.json();
        setFollowers(data.followers || []);
      }
      if (followingRes.ok) {
        const data = await followingRes.json();
        setFollowing(data.following || []);
      }
    } catch (err) {
      console.error('Failed to load followers/following:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFollow = async (user) => {
    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
    if (!token) return;

    setActionLoadingId(user.id);
    const endpoint = user.iFollowThem ? `/api/follows/${user.username}/unfollow` : `/api/follows/${user.username}/follow`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        // Update local state
        const updatedStatus = !user.iFollowThem;
        const updateItem = item => item.id === user.id ? { ...item, iFollowThem: updatedStatus } : item;
        setFollowers(prev => prev.map(updateItem));
        setFollowing(prev => {
          if (!updatedStatus && targetUsername === currentUsername) {
            return prev.filter(item => item.id !== user.id);
          }
          return prev.map(updateItem);
        });

        if (onRelationshipChanged) onRelationshipChanged();
      }
    } catch (err) {
      console.error('Toggle follow failed:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveFollower = async (user) => {
    const token = localStorage.getItem('funflick_token') || sessionStorage.getItem('funflick_token');
    if (!token) return;

    setActionLoadingId(user.id);
    try {
      const res = await fetch(`/api/follows/${user.username}/remove-follower`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setFollowers(prev => prev.filter(f => f.id !== user.id));
        if (onRelationshipChanged) onRelationshipChanged();
      }
    } catch (err) {
      console.error('Remove follower failed:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (!isOpen) return null;

  const currentList = activeTab === 'followers' ? followers : following;
  const filteredList = currentList.filter(u => 
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const isOwnProfile = targetUsername === currentUsername;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#120a26] border border-white/10 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] h-[550px] overflow-hidden animate-slide-up">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-white font-heading">
              @{targetUsername}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 bg-black/20">
          <button
            onClick={() => { setActiveTab('followers'); setSearchQuery(''); }}
            className={`flex-1 py-3 text-xs font-extrabold border-b-2 transition ${
              activeTab === 'followers'
                ? 'border-pink-500 text-pink-400 bg-pink-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Followers ({followers.length})
          </button>
          <button
            onClick={() => { setActiveTab('following'); setSearchQuery(''); }}
            className={`flex-1 py-3 text-xs font-extrabold border-b-2 transition ${
              activeTab === 'following'
                ? 'border-pink-500 text-pink-400 bg-pink-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Following ({following.length})
          </button>
        </div>

        {/* Search input */}
        <div className="p-3 border-b border-white/5">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-pink-500 mb-2" />
              <span className="text-xs">Loading {activeTab}...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center px-4">
              <span className="text-xs font-semibold text-gray-300 mb-1">
                {searchQuery ? 'No matching users found' : `No ${activeTab} yet`}
              </span>
              <span className="text-[11px] text-gray-500">
                {activeTab === 'followers' 
                  ? 'When users follow this account, they will appear here.'
                  : 'Accounts followed will appear here.'}
              </span>
            </div>
          ) : (
            filteredList.map(user => {
              const isSelf = user.username === currentUsername;
              const isBusy = actionLoadingId === user.id;

              return (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 transition"
                >
                  {/* User info */}
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <img 
                      src={user.avatar || '/brand/default-avatar.svg'} 
                      alt={user.name} 
                      className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0" 
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-white truncate block">
                          {user.name}
                        </span>
                        {isSelf && (
                          <span className="px-1.5 py-0.2 rounded-md bg-white/10 text-[9px] text-gray-300 font-semibold shrink-0">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 truncate block">
                        @{user.username}
                      </span>

                      {/* Mutual status tags */}
                      {!isSelf && (
                        <div className="flex items-center gap-1 mt-0.5">
                          {user.theyFollowMe ? (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                              Follows you
                            </span>
                          ) : (
                            <span className="text-[9px] text-gray-400 bg-white/5 px-1.5 py-0.2 rounded">
                              Doesn't follow you
                            </span>
                          )}
                          {user.iFollowThem && (
                            <span className="text-[9px] font-bold text-pink-400 bg-pink-500/10 px-1.5 py-0.2 rounded border border-pink-500/20">
                              You follow
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isSelf ? (
                      <span className="text-[11px] text-gray-400 font-bold px-3 py-1 bg-white/5 rounded-xl border border-white/10">
                        My Account
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleToggleFollow(user)}
                          disabled={isBusy}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm ${
                            user.iFollowThem
                              ? 'bg-white/10 hover:bg-white/15 text-gray-200 border border-white/15'
                              : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:brightness-110 active:scale-95'
                          }`}
                        >
                          {isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : user.iFollowThem ? (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-pink-400" />
                              <span>Following</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Follow</span>
                            </>
                          )}
                        </button>

                        {/* If viewing own followers, allow removing follower */}
                        {isOwnProfile && activeTab === 'followers' && (
                          <button
                            onClick={() => handleRemoveFollower(user)}
                            disabled={isBusy}
                            title="Remove follower"
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-black/40 border-t border-white/5 text-center">
          <span className="text-[10px] text-gray-400">
            Real FunFlick connection network powered by AWS MySQL
          </span>
        </div>
      </div>
    </div>
  );
};

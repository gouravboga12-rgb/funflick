import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Plus } from 'lucide-react';

export const StoryBar = () => {
  const { 
    stories, 
    currentUser, 
    setActiveStoryGroup, 
    setSubscriptionGateModalOpen 
  } = useApp();
  const navigate = useNavigate();

  const handleMyStoryClick = (userStory) => {
    if (userStory.stories && userStory.stories.length > 0) {
      setActiveStoryGroup(userStory);
    } else {
      // Check publishing subscription
      if (!currentUser.hasPublishingSubscription) {
        setSubscriptionGateModalOpen(true);
      } else {
        navigate('/create/story');
      }
    }
  };

  const handleCreatorStoryClick = (storyGroup) => {
    setActiveStoryGroup(storyGroup);
  };

  return (
    <div className="w-full shrink-0 py-2.5 px-4 overflow-x-auto no-scrollbar border-b border-white/5 select-none bg-[#090514]">
      <div className="flex items-center gap-3.5 min-w-max pb-1">
        {stories.map(story => {
          if (story.isUser) {
            const hasStories = story.stories && story.stories.length > 0;
            return (
              <div 
                key="my_story"
                onClick={() => handleMyStoryClick(story)}
                className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0"
              >
                <div className="relative">
                  <div className={`w-[62px] h-[62px] rounded-full p-[2px] transition ${
                    hasStories ? 'bg-gradient-to-tr from-[#ff8a00] via-[#ff007a] to-[#7928ca]' : 'p-0'
                  }`}>
                    <div className="w-full h-full rounded-full border-2 border-[#090614] overflow-hidden bg-gray-900">
                      <img 
                        src={currentUser.avatar || currentUser.avatar_url || '/brand/default-avatar.svg'} 
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/brand/default-avatar.svg'; }}
                        alt="My Story" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                    </div>
                  </div>
                  
                  {/* Plus badge */}
                  <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-gradient-to-r from-[#ff007a] to-[#ff4b2b] border-2 border-[#090614] flex items-center justify-center text-white shadow-md">
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-gray-200 max-w-[66px] text-center truncate">
                  Your Story
                </span>
              </div>
            );
          }

          return (
            <div 
              key={story.id}
              onClick={() => handleCreatorStoryClick(story)}
              className="flex flex-col items-center gap-1.5 cursor-pointer group shrink-0"
            >
              <div className={`w-[62px] h-[62px] rounded-full p-[2.5px] transition-transform group-hover:scale-105 active:scale-95 ${
                story.hasUnseen 
                  ? 'bg-gradient-to-tr from-[#ff8a00] via-[#ff007a] to-[#7928ca] shadow-sm shadow-pink-500/20' 
                  : 'bg-white/20'
              }`}>
                <div className="w-full h-full rounded-full border-2 border-[#090614] overflow-hidden bg-gray-900">
                  <img 
                    src={story.avatar || '/brand/default-avatar.svg'} 
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/brand/default-avatar.svg'; }}
                    alt={story.username} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>
              <span className="text-[11px] font-semibold text-gray-300 max-w-[66px] text-center truncate">
                {story.username.replace('_official', '')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

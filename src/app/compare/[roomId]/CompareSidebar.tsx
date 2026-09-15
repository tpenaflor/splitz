"use client";

import { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Users, Link as LinkIcon, Activity as ActivityIcon, Loader2, X, CheckCircle2, Trash2, Info, Route } from 'lucide-react';
import Uploader from '@/components/Uploader';

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type CompareSidebarProps = {
  roomId: string;
  isOpen?: boolean;
  onClose?: () => void;
};

export default function CompareSidebar({ roomId, isOpen, onClose }: CompareSidebarProps) {
  const { activities, addActivity, removeActivity, detectedSegments, activeSegmentId, setActiveSegment, segmentRange, setSegmentRange, deleteSegment, segmentResults } = useAppStore();
  const [participants, setParticipants] = useState<any[]>([]);
  const [roomMode, setRoomMode] = useState<string>('event');
  const [shareLink, setShareLink] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [stravaActivities, setStravaActivities] = useState<any[]>([]);
  const [loadingStrava, setLoadingStrava] = useState(false);
  const [uploadingActivity, setUploadingActivity] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fetchingRefs = useRef<Set<string>>(new Set());

  const [pendingActivityData, setPendingActivityData] = useState<any | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const [includeHeartRate, setIncludeHeartRate] = useState(false);
  const [includePower, setIncludePower] = useState(false);
  const [includeCadence, setIncludeCadence] = useState(false);
  const [includeSpeed, setIncludeSpeed] = useState(false);

  useEffect(() => {
    setShareLink(window.location.href);

    const fetchParticipants = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}/participants`);
        if (!res.ok) return;
        const data = await res.json();
        setParticipants(data.participants || []);
        if (data.mode) {
          setRoomMode(data.mode);
          useAppStore.getState().setAppMode(data.mode);
        }
      } catch (e) {}
    };

    fetchParticipants();
    const interval = setInterval(fetchParticipants, 5000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    participants.forEach(async (p) => {
      const pId = p.id.toString();
      if (!activities.find(a => a.id.toString() === pId) && !fetchingRefs.current.has(pId)) {
        fetchingRefs.current.add(pId);
        try {
          const res = await fetch(p.dataUrl);
          if (res.ok) {
            const activityData = await res.json();
            activityData.id = activityData.id.toString();
            addActivity(activityData);
          } else {
            fetchingRefs.current.delete(pId);
          }
        } catch (e) {
          console.error("Failed to load participant data", e);
          fetchingRefs.current.delete(pId);
        }
      }
    });
  }, [participants, activities, addActivity]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const accessToken = new URLSearchParams(hash.substring(1)).get('access_token');
      if (accessToken) {
        setToken(accessToken);
        window.history.replaceState(null, '', window.location.pathname);
        fetchStravaActivities(accessToken);
      }
    }
  }, []);

  const fetchStravaActivities = async (t: string, search?: string) => {
    setLoadingStrava(true);
    try {
      const queryParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`/api/strava/activities?token=${t}${queryParam}`);
      const data = await res.json();
      setStravaActivities(data.activities || []);
    } catch (e) {}
    setLoadingStrava(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
      fetchStravaActivities(token, searchQuery);
    }
  };

  const handleSelectStravaActivity = async (stravaAct: any) => {
    const strId = stravaAct.id.toString();
    setUploadingActivity(strId);
    try {
      const startTimeSec = new Date(stravaAct.start_date).getTime() / 1000;
      const res = await fetch(`/api/strava/streams?activityId=${strId}&token=${token}&startTime=${startTimeSec}&name=${encodeURIComponent(stravaAct.name)}`);
      if (!res.ok) throw new Error("Failed to fetch streams");
      const { activityData } = await res.json();
      
      setPendingActivityData(activityData);
      setRenameInput(activityData.name);
    } catch (e) {
      alert("Error fetching activity data. Does it have GPS data?");
    } finally {
      setUploadingActivity(null);
    }
  };

  const handleUploaderData = (data: any) => {
    setPendingActivityData(data);
    setRenameInput(data.name);
  };

  const confirmUpload = async () => {
    if (!pendingActivityData) return;
    setUploadingActivity('confirm');
    try {
      const dataToUpload = { 
        ...pendingActivityData, 
        name: renameInput || 'Unnamed Activity',
        positions: pendingActivityData.positions.map((p: any) => {
          const newP = { ...p };
          if (!includeHeartRate) delete newP.heartRate;
          if (!includePower) delete newP.power;
          if (!includeCadence) delete newP.cadence;
          if (!includeSpeed) delete newP.speed;
          return newP;
        })
      };
      const res = await fetch(`/api/rooms/${roomId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityData: dataToUpload })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to upload activity');
      }

      setStravaActivities([]);
      setToken(null);
      setPendingActivityData(null);
      addActivity(dataToUpload);
    } catch (e: any) {
      alert(e.message || "Error adding activity to group.");
    } finally {
      setUploadingActivity(null);
    }
  };

  const handleDeleteParticipant = async (participantId: string) => {
    if (!confirm('Remove this activity from the group?')) return;
    try {
      await fetch(`/api/rooms/${roomId}/participants/${participantId}`, { method: 'DELETE' });
      setParticipants(p => p.filter(x => x.id.toString() !== participantId.toString()));
      removeActivity(participantId);
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`fixed inset-y-0 right-0 z-50 w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col h-[100dvh] md:h-full overflow-hidden transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:relative md:translate-x-0 md:w-96`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-500" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Activity Group</h1>
            <span className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded uppercase font-bold text-[10px] relative group cursor-help ml-2">
              {roomMode}
              <Info className="w-3 h-3 ml-1 opacity-70" />
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-gray-900 text-white text-[11px] p-2 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 font-normal normal-case text-center">
                {roomMode === 'event' ? 'Event mode: Activities must overlap in both space and time.' : 'Segment mode: Activities must overlap in space only.'}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900"></div>
              </div>
            </span>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
          <p className="text-xs text-purple-800 dark:text-purple-300 mb-2 font-medium">Invite friends to join this group:</p>
          <div className="flex items-center gap-2">
            <input 
              readOnly 
              value={shareLink}
              className="flex-1 bg-white dark:bg-gray-800 text-xs p-2 rounded border border-purple-200 dark:border-purple-700 text-gray-600 dark:text-gray-300 focus:outline-none"
            />
            <button 
              onClick={copyToClipboard}
              className="p-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-800 dark:hover:bg-purple-700 rounded text-purple-700 dark:text-purple-200 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {pendingActivityData ? (
          <div className="p-4 border border-purple-200 dark:border-purple-800 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Rename & Upload</h2>
            <input 
              type="text" 
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-sm mb-4 focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="Activity Name"
            />
            
            <div className="mb-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Share Telemetry Data (Location always included):</p>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={includeHeartRate} onChange={(e) => setIncludeHeartRate(e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500 bg-gray-100 border-gray-300" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Heart Rate</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={includePower} onChange={(e) => setIncludePower(e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500 bg-gray-100 border-gray-300" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Power</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={includeCadence} onChange={(e) => setIncludeCadence(e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500 bg-gray-100 border-gray-300" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Cadence</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={includeSpeed} onChange={(e) => setIncludeSpeed(e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500 bg-gray-100 border-gray-300" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Speed</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setPendingActivityData(null)}
                className="flex-1 py-2 rounded-lg text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmUpload}
                disabled={uploadingActivity === 'confirm'}
                className="flex-1 py-2 rounded-lg text-white bg-purple-600 hover:bg-purple-700 text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploadingActivity === 'confirm' && <Loader2 className="w-4 h-4 animate-spin" />}
                Upload
              </button>
            </div>
          </div>
        ) : token ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">Select Activity to Share</h2>
              <button onClick={() => { setStravaActivities([]); setToken(null); setSearchQuery(''); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            
            <form onSubmit={handleSearch} className="mb-3 flex gap-2">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or ID..."
                className="flex-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-900 dark:text-white"
              />
              <button 
                type="submit" 
                className="px-3 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-800/50 transition-colors flex items-center justify-center min-w-[60px]"
                disabled={loadingStrava}
              >
                {loadingStrava ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </button>
            </form>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {loadingStrava && stravaActivities.length === 0 ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                </div>
              ) : stravaActivities.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No activities found.</p>
              ) : (
                stravaActivities.map(act => (
                  <button 
                    key={act.id}
                    disabled={uploadingActivity === act.id.toString()}
                    onClick={() => handleSelectStravaActivity(act)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-500 bg-gray-50 dark:bg-gray-800 transition-colors flex justify-between items-center disabled:opacity-50"
                  >
                    <div className="truncate pr-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{act.name}</p>
                      <p className="text-xs text-gray-500">{new Date(act.start_date).toLocaleDateString()} • {(act.distance / 1000).toFixed(1)} km</p>
                    </div>
                    {uploadingActivity === act.id.toString() && <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />}
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300">Add Your Activity</h2>
            {loadingStrava ? (
              <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
              </div>
            ) : (
              <a 
                href={`/api/strava/login?returnTo=${encodeURIComponent(`/compare/${roomId}`)}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#FC4C02] hover:bg-[#E34402] text-white font-medium rounded-lg shadow-sm transition-colors"
              >
                <ActivityIcon className="w-4 h-4" />
                Connect with Strava
              </a>
            )}
            
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
              <span className="text-xs text-gray-400">OR</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
            </div>
            
            <Uploader onActivityParsed={handleUploaderData} />
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Participants ({participants.length})
        </h2>
        
        {participants.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            Waiting for others to join...
          </p>
        )}

        <div className="space-y-3">
          {participants.map((p, idx) => {
            const isLoadedLocally = activities.find(a => a.id.toString() === p.id.toString());
            return (
              <div key={p.id || idx} className="bg-white dark:bg-gray-800 rounded-lg p-3 relative border-l-4 border flex items-center justify-between shadow-sm group" style={{ borderColor: p.color || '#ccc' }}>
                <div className="truncate pr-2 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{p.name || 'Anonymous Activity'}</h3>
                  <p className="text-xs text-gray-500">{isLoadedLocally ? 'Synced' : 'Downloading...'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!isLoadedLocally && <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />}
                  <button 
                    onClick={() => handleDeleteParticipant(p.id.toString())}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-red-500 rounded"
                    title="Remove from group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800" />

        {roomMode === 'segment' && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Detected Shared Routes</h2>
            {detectedSegments.length === 0 ? (
              <div className="text-gray-500 text-sm">Upload at least two overlapping routes to detect segments.</div>
            ) : (
          detectedSegments.map((seg, idx) => (
            <div key={seg.id} className={`bg-white dark:bg-gray-800 rounded-lg p-4 border transition-colors ${activeSegmentId === seg.id ? 'border-purple-500' : 'border-gray-200 dark:border-gray-700 cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 shadow-sm'}`}>
              {activeSegmentId !== seg.id ? (
                <div onClick={() => setActiveSegment(seg.id)} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <Route className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-900 dark:text-white font-medium">{seg.name || `Segment ${idx + 1}`}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">{(seg.lengthMeters / 1000).toFixed(2)} km</span>
                    {seg.isCustom && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteSegment(seg.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete segment"
                      >
                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400 font-bold">{seg.name || `Segment ${idx + 1}`} (Active)</span>
                    <div className="flex items-center gap-2">
                      {seg.isCustom && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteSegment(seg.id); }}
                          title="Delete segment"
                        >
                          <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                        </button>
                      )}
                      <button onClick={() => setActiveSegment(null)}><X className="w-4 h-4 text-gray-400 hover:text-white" /></button>
                    </div>
                  </div>
                  
                  {roomMode === 'segment' && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-gray-500 dark:text-gray-400">Trim Segment Start / End</label>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500 w-8">Start</span>
                        <input 
                          type="range" 
                          min={seg.startIndex} 
                          max={seg.endIndex} 
                          value={(segmentRange?.[0] ?? seg.startIndex)}
                          onChange={(e) => setSegmentRange([Number(e.target.value), (segmentRange?.[1] ?? seg.endIndex)])}
                          className="flex-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none accent-purple-500"
                        />
                        <span className="text-xs text-gray-500 w-8 text-right">{Math.round((((segmentRange?.[0] ?? seg.startIndex) - seg.startIndex) / Math.max(1, seg.endIndex - seg.startIndex)) * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-8">End</span>
                        <input 
                          type="range" 
                          min={seg.startIndex} 
                          max={seg.endIndex} 
                          value={(segmentRange?.[1] ?? seg.endIndex)}
                          onChange={(e) => setSegmentRange([(segmentRange?.[0] ?? seg.startIndex), Number(e.target.value)])}
                          className="flex-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none accent-purple-500"
                        />
                        <span className="text-xs text-gray-500 w-8 text-right">{Math.round((((segmentRange?.[1] ?? seg.endIndex) - seg.startIndex) / Math.max(1, seg.endIndex - seg.startIndex)) * 100)}%</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <h4 className="text-xs text-gray-500 dark:text-gray-400 uppercase">Leaderboard</h4>
                    {segmentResults
                      .sort((a, b) => a.duration - b.duration)
                      .map((res, i) => {
                        const act = activities.find(a => a.id === res.activityId);
                        if (!act) return null;
                        return (
                          <div key={res.activityId} className="flex justify-between items-center text-sm p-2 bg-gray-100 dark:bg-gray-900 rounded border-l-2" style={{ borderColor: act.color }}>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 w-4">{i + 1}.</span>
                              <span className="text-gray-700 dark:text-gray-200 truncate max-w-[120px]">{act.name}</span>
                            </div>
                            <span className="font-mono font-bold text-purple-400">{formatDuration(res.duration)}</span>
                          </div>
                        );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        </div>
        )}
      </div>
    </div>
  );
}

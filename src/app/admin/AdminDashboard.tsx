"use client";

import { useEffect, useState } from 'react';
import { Loader2, Trash2, ChevronDown, ChevronRight, Activity, Calendar, Info } from 'lucide-react';

type Participant = {
  id: string;
  name?: string;
  color?: string;
};

type Room = {
  id: string;
  createdAt: string;
  mode: 'event' | 'segment';
  participants: Participant[];
};

export default function AdminDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set());

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      } else {
        console.error('Failed to fetch rooms', await res.text());
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const toggleExpand = (roomId: string) => {
    const next = new Set(expandedRooms);
    if (next.has(roomId)) {
      next.delete(roomId);
    } else {
      next.add(roomId);
    }
    setExpandedRooms(next);
  };

  const deleteRoom = async (roomId: string) => {
    if (!confirm('Are you sure you want to delete this ENTIRE group and all its activities?')) return;
    try {
      await fetch(`/api/admin/rooms/${roomId}`, { method: 'DELETE' });
      setRooms(rooms.filter(r => r.id !== roomId));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteParticipant = async (roomId: string, participantId: string) => {
    if (!confirm('Remove this activity from the group?')) return;
    try {
      await fetch(`/api/rooms/${roomId}/participants/${participantId}`, { method: 'DELETE' });
      setRooms(rooms.map(r => {
        if (r.id === roomId) {
          return { ...r, participants: r.participants.filter(p => p.id !== participantId) };
        }
        return r;
      }));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Activity Groups ({rooms.length})</h2>
        <button onClick={fetchRooms} className="text-sm px-4 py-2 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition">
          Refresh
        </button>
      </div>

      {rooms.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No activity groups found.</p>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm">
          {rooms.map((room) => {
            const isExpanded = expandedRooms.has(room.id);
            return (
              <div key={room.id} className="border-b border-gray-200 dark:border-gray-800 last:border-0">
                <div 
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer"
                  onClick={() => toggleExpand(room.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 font-mono">{room.id}</h3>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(room.createdAt).toLocaleString()}</span>
                        <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {room.participants.length} activities</span>
                        <span className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded uppercase font-bold text-[10px] relative group cursor-help">
                          {room.mode}
                          <Info className="w-3 h-3 ml-1 opacity-70" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-[11px] p-2 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 font-normal normal-case text-center">
                            {room.mode === 'event' ? 'Event mode: Activities must overlap in both space and time.' : 'Segment mode: Activities must overlap in space only.'}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteRoom(room.id); }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                    title="Delete Group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {isExpanded && (
                  <div className="bg-gray-50 dark:bg-gray-950/50 p-4 border-t border-gray-200 dark:border-gray-800">
                    {room.participants.length === 0 ? (
                      <p className="text-sm text-gray-500 italic px-9">No activities yet.</p>
                    ) : (
                      <div className="space-y-2 pl-9">
                        {room.participants.map(p => (
                          <div key={p.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 shadow-sm border-l-4" style={{ borderColor: p.color || '#ccc' }}>
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{p.name || 'Unnamed Activity'}</span>
                            <button 
                              onClick={() => deleteParticipant(room.id, p.id)}
                              className="text-gray-400 hover:text-red-500 p-1"
                              title="Delete Activity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

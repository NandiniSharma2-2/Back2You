import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Search, ArrowLeft } from 'lucide-react';
import api from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { getSocket } from '../../lib/socket';
import { format } from 'date-fns';

export default function ChatPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await api.get('/chat/rooms');
      setRooms(res.data.data.rooms || []);
      setLoading(false);

      const roomUuid = searchParams.get('room');
      if (roomUuid) {
        const room = res.data.data.rooms.find(r => r.uuid === roomUuid);
        if (room) selectRoom(room);
      }
    } catch { setLoading(false); }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const selectRoom = async (room) => {
    setActiveRoom(room);
    try {
      const res = await api.get(`/chat/rooms/${room.uuid}/messages`);
      setMessages(res.data.data.messages || []);

      // Join socket room
      const socket = getSocket();
      if (socket) {
        socket.emit('join_room', room.uuid);
      }
    } catch {}
  };

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (data) => {
      if (activeRoom && data.roomId === activeRoom.id) {
        setMessages(prev => [...prev, data.message]);
      }
      setRooms(prev => prev.map(r =>
        r.id === data.roomId ? { ...r, last_message_content: data.message.content, last_message_time: data.message.created_at } : r
      ));
    };

    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom || sending) return;

    setSending(true);
    const content = newMessage.trim();
    setNewMessage('');

    try {
      const res = await api.post(`/chat/rooms/${activeRoom.uuid}/messages`, { content });
      setMessages(prev => [...prev, res.data.data.message]);
    } catch {}
    finally { setSending(false); inputRef.current?.focus(); }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.06)', background: '#0D1117' }}>
      
      {/* Rooms List */}
      <div className={`${activeRoom ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 border-r`}
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="font-semibold text-white flex items-center gap-2">
            <MessageSquare size={16} className="text-neon-cyan" /> Messages
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 bg-white/5 rounded mb-1.5" />
                    <div className="h-2.5 bg-white/3 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <MessageSquare size={32} className="text-white/10 mb-3" />
              <p className="text-sm text-white/30">No conversations yet</p>
            </div>
          ) : (
            rooms.map(room => (
              <button key={room.id} onClick={() => selectRoom(room)}
                className={`w-full flex items-center gap-3 p-4 text-left transition-all ${
                  activeRoom?.id === room.id ? 'bg-neon-cyan/8' : 'hover:bg-white/3'
                }`}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #00F0FF33, #FF007F33)', border: '1px solid rgba(0,240,255,0.2)' }}>
                  {room.other_first_name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white/80 truncate">{room.other_first_name} ({room.other_username})</p>
                    {room.unread_count > 0 && (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-neon-pink text-black min-w-[20px] text-center">
                        {room.unread_count}
                      </span>
                    )}
                  </div>
                  {room.last_message_content && (
                    <p className="text-xs text-white/30 truncate mt-0.5">{room.last_message_content}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Messages */}
      {activeRoom ? (
        <div className="flex-1 flex flex-col">
          {/* Chat header */}
          <div className="h-16 flex items-center gap-3 px-5 border-b flex-shrink-0"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <button onClick={() => setActiveRoom(null)} className="md:hidden p-2 text-white/40 hover:text-white">
              <ArrowLeft size={16} />
            </button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #00F0FF33, #FF007F33)', border: '1px solid rgba(0,240,255,0.2)' }}>
              {activeRoom.other_first_name?.[0] || '?'}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{activeRoom.other_first_name}</p>
              <p className="text-xs text-white/30">@{activeRoom.other_username}</p>
            </div>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {messages.map((msg, i) => {
              const isOwn = msg.sender_id === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div
                      className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={{
                        background: isOwn
                          ? 'linear-gradient(135deg, #00F0FF20, #FF007F20)'
                          : 'rgba(255,255,255,0.06)',
                        border: isOwn
                          ? '1px solid rgba(0,240,255,0.2)'
                          : '1px solid rgba(255,255,255,0.08)',
                        color: '#e2e8f0',
                        borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      }}
                    >
                      {msg.content}
                    </div>
                    <span className="text-xs text-white/20 px-1">
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </span>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t flex gap-3 items-center flex-shrink-0"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <input
              ref={inputRef}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 input-field py-2.5"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-2.5 rounded-lg transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #00F0FF, #FF007F)', color: '#000' }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center">
            <MessageSquare size={40} className="text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">Select a conversation to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}

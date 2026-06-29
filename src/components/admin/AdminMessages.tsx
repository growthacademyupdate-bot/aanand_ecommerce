"use client";

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useStore } from '@/store/useStore';

type ContactMessage = {
  _id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

const AdminMessages = () => {
  const token = useStore((s) => s.token);
  const isAdmin = useStore((s) => s.isAdmin);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authToken =
    token ||
    (typeof window !== 'undefined' ? localStorage.getItem('token') : null) ||
    (isLoggedIn && isAdmin ? 'admin-token' : null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/contact', {
          headers: authToken ? { authorization: `Bearer ${authToken}` } : undefined,
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to load messages');
          return;
        }

        setMessages(data.messages || []);
      } catch {
        setError('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [authToken]);

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-bold mb-6">Contact Messages</h1>

      {isLoading ? (
        <div className="bg-card rounded-xl p-6 border border-border text-sm text-muted-foreground">Loading...</div>
      ) : error ? (
        <div className="bg-card rounded-xl p-6 border border-border text-sm text-destructive">{error}</div>
      ) : messages.length === 0 ? (
        <div className="bg-card rounded-xl p-6 border border-border text-sm text-muted-foreground">No messages yet.</div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m._id} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{m.name}</p>
                  <p className="text-xs text-muted-foreground break-all">{m.email}</p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                </p>
              </div>
              <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">{m.message}</p>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMessages;

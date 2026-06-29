"use client";

import AdminLayout from '@/components/AdminLayout';
import { useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';

type AnnouncementState = {
  enabled: boolean;
  text: string;
};

type ApiResponse = {
  success: boolean;
  data?: AnnouncementState;
  error?: string;
};

const AdminAnnouncementBar = () => {
  const [state, setState] = useState<AnnouncementState>({ enabled: true, text: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/announcement-bar', {
        headers: { authorization: 'Bearer admin-token' },
      });
      const data = (await res.json()) as ApiResponse;

      if (!res.ok || !data?.success || !data.data) {
        toast({ title: data?.error || 'Failed to load announcement settings', variant: 'destructive' });
        return;
      }

      setState({ enabled: Boolean(data.data.enabled), text: String(data.data.text || '') });
    } catch {
      toast({ title: 'Failed to load announcement settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/announcement-bar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          authorization: 'Bearer admin-token',
        },
        body: JSON.stringify({ enabled: state.enabled, text: state.text }),
      });

      const data = (await res.json()) as ApiResponse;
      if (!res.ok || !data?.success) {
        toast({ title: data?.error || 'Failed to save', variant: 'destructive' });
        return;
      }

      toast({ title: 'Announcement updated' });
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-start justify-between gap-4 mb-6 flex-col sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold">Announcement Bar</h1>
          <p className="text-sm text-muted-foreground">Edit the black badge above the navbar</p>
        </div>
        <button onClick={save} disabled={saving || loading} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {loading ? (
        <div className="bg-card rounded-xl border border-border p-4 text-sm text-muted-foreground">Loading settings...</div>
      ) : null}

      <div className="bg-card rounded-xl border border-border p-6 space-y-5 max-w-2xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Show announcement bar</p>
            <p className="text-xs text-muted-foreground">Hide/show the entire black badge</p>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only"
              checked={state.enabled}
              onChange={(e) => setState((s) => ({ ...s, enabled: e.target.checked }))}
            />
            <div className={`w-11 h-6 rounded-full transition-colors ${state.enabled ? 'bg-primary' : 'bg-muted'} relative`}>
              <div className={`w-5 h-5 bg-background rounded-full absolute top-0.5 transition-transform ${state.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Badge Text</label>
          <input
            value={state.text}
            onChange={(e) => setState((s) => ({ ...s, text: e.target.value }))}
            placeholder="Free Shipping On Orders Above 1499"
            className="w-full border border-border rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground mt-2">Example: type “SALE” and click Save.</p>
        </div>

        <div className="rounded-lg border border-border bg-black text-white px-4 py-2 text-sm font-medium flex items-center justify-center">
          {state.enabled ? (state.text || '—') : 'Hidden'}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnnouncementBar;

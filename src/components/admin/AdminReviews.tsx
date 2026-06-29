"use client";

import { useEffect, useState } from 'react';
import { Check, Trash2, Star, Loader2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { useStore } from '@/store/useStore';
import { toast } from '@/hooks/use-toast';

type ReviewItem = {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  avatar: string;
  approved: boolean;
  createdAt: string | null;
};

const AdminReviews = () => {
  const token = useStore((s) => s.token);
  const isAdmin = useStore((s) => s.isAdmin);
  const isLoggedIn = useStore((s) => s.isLoggedIn);

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const authToken =
    token ||
    (typeof window !== 'undefined' ? localStorage.getItem('token') : null) ||
    (isLoggedIn && isAdmin ? 'admin-token' : null);

  const loadReviews = async () => {
    if (!authToken) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        headers: { authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();

      if (!res.ok) {
        toast({ title: data.error || 'Failed to load reviews', variant: 'destructive' });
        return;
      }

      setReviews(data.reviews || []);
    } catch {
      toast({ title: 'Failed to load reviews', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const approveReview = async (id: string) => {
    if (!authToken) return;
    if (approvingId || deletingId) return;
    setApprovingId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ approved: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Failed to approve review', variant: 'destructive' });
        return;
      }

      toast({ title: 'Review approved' });
      await loadReviews();
    } catch {
      toast({ title: 'Failed to approve review', variant: 'destructive' });
    } finally {
      setApprovingId(null);
    }
  };

  const deleteReview = async (id: string) => {
    if (!authToken) return;
    if (approvingId || deletingId) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${authToken}` },
      });

      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || 'Failed to delete review', variant: 'destructive' });
        return;
      }

      toast({ title: 'Review deleted' });
      await loadReviews();
    } catch {
      toast({ title: 'Failed to delete review', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const pending = reviews.filter((r) => !r.approved);
  const approved = reviews.filter((r) => r.approved);

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl font-bold mb-6">Reviews Management</h1>

      {isLoading && (
        <div className="bg-card rounded-xl p-6 border border-border text-sm text-muted-foreground mb-6">
          Loading...
        </div>
      )}

      {/* Pending */}
      <div className="mb-8">
        <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
          Pending Approval
          {pending.length > 0 && <span className="bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-full">{pending.length}</span>}
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-card rounded-xl p-6 border border-border">No pending reviews.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r._id} className="bg-card rounded-xl p-4 border border-border flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm shrink-0">{r.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{r.name}</p>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={`star-${i}-${r._id}`} className={`h-3 w-3 ${i < r.rating ? 'text-gold fill-gold' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.comment}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => { approveReview(r._id); }}
                    disabled={Boolean(approvingId || deletingId)}
                    className="p-2 bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Approve"
                  >
                    {approvingId === r._id ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                  <button
                    onClick={() => { deleteReview(r._id); }}
                    disabled={Boolean(approvingId || deletingId)}
                    className="p-2 bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete"
                  >
                    {deletingId === r._id ? (
                      <Loader2 className="h-4 w-4 text-destructive animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved */}
      <h2 className="font-display text-lg font-semibold mb-4">Approved Reviews ({approved.length})</h2>
      <div className="space-y-3">
        {approved.map((r) => (
          <div key={r._id} className="bg-card rounded-xl p-4 border border-border flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">{r.avatar}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-sm">{r.name}</p>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={`star-${i}-${r._id}`} className={`h-3 w-3 ${i < r.rating ? 'text-gold fill-gold' : 'text-muted-foreground'}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{r.comment}</p>
            </div>
            <button
              onClick={() => { deleteReview(r._id); }}
              disabled={Boolean(approvingId || deletingId)}
              className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deletingId === r._id ? (
                <Loader2 className="h-4 w-4 text-destructive animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 text-destructive" />
              )}
            </button>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminReviews;

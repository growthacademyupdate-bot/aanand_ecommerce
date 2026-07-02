"use client";

import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useStore } from '@/store/useStore';
import { Loader2, Settings, Save } from 'lucide-react';

const WholesaleSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wholesaleEnabled, setWholesaleEnabled] = useState(false);
  const { token } = useStore();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setWholesaleEnabled(data.data.wholesaleEnabled);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load wholesale settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ wholesaleEnabled })
      });
      const data = await res.json();
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Wholesale settings saved successfully.",
        });
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save wholesale settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Global Settings
          </h1>
          <p className="text-muted-foreground mt-1">Configure global platform features</p>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6 max-w-2xl">
        <h2 className="text-xl font-semibold mb-6 border-b pb-2">Wholesale / B2B System</h2>
        
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center h-6">
              <input 
                id="wholesale-toggle"
                type="checkbox" 
                checked={wholesaleEnabled}
                onChange={(e) => setWholesaleEnabled(e.target.checked)}
                className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="wholesale-toggle" className="font-medium text-lg text-foreground cursor-pointer">
                Enable Wholesale (B2B) System
              </label>
              <p className="text-sm text-muted-foreground mt-1">
                When enabled, the dynamic wholesale pricing engine will be activated. 
                Products will use their configured MOQ (Minimum Order Quantity) and Wholesale Price when added to the cart.
                Customers will be prompted to add more items to unlock wholesale pricing.
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WholesaleSettings;

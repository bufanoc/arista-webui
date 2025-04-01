import React, { useEffect, useState } from 'react';
import { Layers, Plus, Settings, Trash2 } from 'lucide-react';
import { useSwitchStore } from '../store/switch';
import { VlanConfig } from '../types/arista';

export default function Vlans() {
  const { vlans, fetchVlans, updateVlan, isLoading, error } = useSwitchStore();
  const [editingVlan, setEditingVlan] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<VlanConfig>>({});

  useEffect(() => {
    fetchVlans();
  }, []);

  const handleEdit = (vlan: VlanConfig) => {
    setEditingVlan(vlan.vlanId);
    setEditForm(vlan);
  };

  const handleSave = async () => {
    if (editingVlan && editForm) {
      await updateVlan(editingVlan, editForm);
      setEditingVlan(null);
      setEditForm({});
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading VLANs...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">VLAN Management</h1>
        <button className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
          <Plus className="h-5 w-5 mr-2" />
          Add VLAN
        </button>
      </div>
      
      <div className="grid gap-6">
        {vlans.map((vlan) => (
          <div key={vlan.vlanId} className="bg-white rounded-lg shadow p-6">
            {editingVlan === vlan.vlanId ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <select
                    value={editForm.state || 'active'}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value as 'active' | 'suspend' })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    <option value="active">Active</option>
                    <option value="suspend">Suspended</option>
                  </select>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingVlan(null);
                      setEditForm({});
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Layers className="h-5 w-5 text-blue-500" />
                    <h2 className="text-xl font-semibold text-gray-800">
                      VLAN {vlan.vlanId}
                    </h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(vlan)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-red-500 hover:text-red-700">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Name:</span> {vlan.name}
                  </div>
                  <div>
                    <span className="font-medium">State:</span>{' '}
                    <span className={vlan.state === 'active' ? 'text-green-500' : 'text-yellow-500'}>
                      {vlan.state === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
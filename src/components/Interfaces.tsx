import React, { useEffect, useState } from 'react';
import { Network, Power, Settings } from 'lucide-react';
import { useSwitchStore } from '../store/switch';
import { InterfaceConfig } from '../types/arista';

export default function Interfaces() {
  const { interfaces, fetchInterfaces, updateInterface, isLoading, error } = useSwitchStore();
  const [editingInterface, setEditingInterface] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<InterfaceConfig>>({});

  useEffect(() => {
    fetchInterfaces();
  }, []);

  const handleEdit = (iface: InterfaceConfig) => {
    setEditingInterface(iface.name);
    setEditForm(iface);
  };

  const handleSave = async () => {
    if (editingInterface && editForm) {
      await updateInterface(editingInterface, editForm);
      setEditingInterface(null);
      setEditForm({});
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading interfaces...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Interface Management</h1>
      
      <div className="grid gap-6">
        {interfaces.map((iface) => (
          <div key={iface.name} className="bg-white rounded-lg shadow p-6">
            {editingInterface === iface.name ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <input
                    type="text"
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">MTU</label>
                  <input
                    type="number"
                    value={editForm.mtu || ''}
                    onChange={(e) => setEditForm({ ...editForm, mtu: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Speed</label>
                  <select
                    value={editForm.speed || ''}
                    onChange={(e) => setEditForm({ ...editForm, speed: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    <option value="">Auto</option>
                    <option value="1G">1 Gbps</option>
                    <option value="10G">10 Gbps</option>
                    <option value="25G">25 Gbps</option>
                    <option value="40G">40 Gbps</option>
                    <option value="100G">100 Gbps</option>
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
                      setEditingInterface(null);
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
                    <Network className="h-5 w-5 text-blue-500" />
                    <h2 className="text-xl font-semibold text-gray-800">{iface.name}</h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Power className={`h-5 w-5 ${iface.enabled ? 'text-green-500' : 'text-red-500'}`} />
                    <button
                      onClick={() => handleEdit(iface)}
                      className="p-2 text-gray-500 hover:text-gray-700"
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Type:</span> {iface.type}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={iface.enabled ? 'text-green-500' : 'text-red-500'}>
                      {iface.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {iface.description && (
                    <div className="col-span-2">
                      <span className="font-medium">Description:</span> {iface.description}
                    </div>
                  )}
                  {iface.mtu && (
                    <div>
                      <span className="font-medium">MTU:</span> {iface.mtu}
                    </div>
                  )}
                  {iface.speed && (
                    <div>
                      <span className="font-medium">Speed:</span> {iface.speed}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
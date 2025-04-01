import React, { useEffect, useState } from 'react';
import { Settings, Network, Plus, Trash2 } from 'lucide-react';
import { useSwitchStore } from '../store/switch';
import { VxlanConfig } from '../types/arista';

export default function Vxlan() {
  const { vxlan, fetchVxlan, updateVxlan, isLoading, error } = useSwitchStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<VxlanConfig>>({});

  useEffect(() => {
    fetchVxlan();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm(vxlan || {});
  };

  const handleSave = async () => {
    if (editForm) {
      await updateVxlan(editForm);
      setIsEditing(false);
      setEditForm({});
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading VXLAN configuration...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">VXLAN Configuration</h1>
        {!vxlan && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Plus className="h-5 w-5 mr-2" />
            Configure VXLAN
          </button>
        )}
      </div>
      
      {(vxlan || isEditing) && (
        <div className="bg-white rounded-lg shadow p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">VNI</label>
                <input
                  type="number"
                  value={editForm.vni || ''}
                  onChange={(e) => setEditForm({ ...editForm, vni: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Source Interface</label>
                <input
                  type="text"
                  value={editForm.source_interface || ''}
                  onChange={(e) => setEditForm({ ...editForm, source_interface: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">UDP Port</label>
                <input
                  type="number"
                  value={editForm.udp_port || ''}
                  onChange={(e) => setEditForm({ ...editForm, udp_port: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
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
                    setIsEditing(false);
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
                  <h2 className="text-xl font-semibold text-gray-800">VXLAN Configuration</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleEdit}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">VNI:</span> {vxlan?.vni}
                </div>
                <div>
                  <span className="font-medium">Source Interface:</span> {vxlan?.source_interface}
                </div>
                <div>
                  <span className="font-medium">UDP Port:</span> {vxlan?.udp_port}
                </div>
                {vxlan?.vlans && (
                  <div className="col-span-2">
                    <span className="font-medium">VLAN Mappings:</span>
                    <div className="mt-2 space-y-1">
                      {Object.entries(vxlan.vlans).map(([vlan, vni]) => (
                        <div key={vlan} className="flex items-center justify-between">
                          <span>VLAN {vlan}</span>
                          <span>VNI {vni}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
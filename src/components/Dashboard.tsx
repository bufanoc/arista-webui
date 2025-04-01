import React, { useEffect } from 'react';
import { Activity, AlertCircle } from 'lucide-react';
import { useSwitchStore } from '../store/switch';

export default function Dashboard() {
  const { interfaces, vlans, vxlan, fetchInterfaces, fetchVlans, fetchVxlan } = useSwitchStore();

  useEffect(() => {
    fetchInterfaces();
    fetchVlans();
    fetchVxlan();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Switch Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Interfaces Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Interfaces</h2>
            <Network className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{interfaces.length}</p>
          <p className="text-sm text-gray-500 mt-2">Total Configured Interfaces</p>
        </div>

        {/* VLANs Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">VLANs</h2>
            <Layers className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{vlans.length}</p>
          <p className="text-sm text-gray-500 mt-2">Configured VLANs</p>
        </div>

        {/* VXLAN Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">VXLAN</h2>
            <Settings className="h-6 w-6 text-purple-500" />
          </div>
          <div className="flex items-center">
            {vxlan ? (
              <Activity className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
            )}
            <p className="text-gray-700">
              {vxlan ? 'Configured' : 'Not Configured'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
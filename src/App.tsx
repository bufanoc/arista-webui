import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Settings, Network, Layers, Activity } from 'lucide-react';
import Interfaces from './components/Interfaces';
import Vlans from './components/Vlans';
import Vxlan from './components/Vxlan';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Arista Manager
            </h1>
          </div>
          <nav className="mt-6">
            <Link to="/" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
              <Activity className="h-5 w-5 mr-3" />
              Dashboard
            </Link>
            <Link to="/interfaces" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
              <Network className="h-5 w-5 mr-3" />
              Interfaces
            </Link>
            <Link to="/vlans" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
              <Layers className="h-5 w-5 mr-3" />
              VLANs
            </Link>
            <Link to="/vxlan" className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100">
              <Settings className="h-5 w-5 mr-3" />
              VXLAN
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/interfaces" element={<Interfaces />} />
            <Route path="/vlans" element={<Vlans />} />
            <Route path="/vxlan" element={<Vxlan />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
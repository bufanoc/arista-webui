export interface AristaCredentials {
  username: string;
  password: string;
  host: string;
}

export interface VlanConfig {
  vlanId: number;
  name: string;
  state: 'active' | 'suspend';
}

export interface InterfaceConfig {
  name: string;
  description?: string;
  enabled: boolean;
  mtu?: number;
  speed?: string;
  type: 'ethernet' | 'vlan' | 'port-channel' | 'loopback';
}

export interface VxlanConfig {
  vni: number;
  source_interface: string;
  udp_port: number;
  vlans?: Record<string, number>;
  vrfs?: Record<string, number>;
}
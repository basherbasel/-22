export interface DeviceInfo {
  brand: string;
  model: string;
  mode: string;
  port: string;
  sn: string;
}

export interface HardwareStatus {
  connected: boolean;
  device: DeviceInfo | null;
  ports: string[];
}

export interface Firmware {
  id: number;
  brand: string;
  model: string;
  version: string;
  path: string;
  checksum: string;
  date_added: string;
}

export interface RepairLog {
  id: number;
  device_id: string;
  operation: string;
  status: string;
  log_output: string;
  timestamp: string;
}

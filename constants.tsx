
import React from 'react';
import { 
  BarChart3, 
  LayoutDashboard, 
  LineChart, 
  Settings, 
  Users, 
  Calculator, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  TrendingUp,
  Download,
  Info
} from 'lucide-react';

export const COLORS = {
  primary: '#250B40', // Crown Money Dark Purple
  secondary: '#E6DEEE', // Crown Money Light Purple
  accent: '#E6DEEE',
  background: '#F7F5F9',
  white: '#ffffff',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  bank: '#94a3b8',
  owner: '#250B40'
};

export const LOGOS = {
  dark: 'https://storage.googleapis.com/crown_money/Logo%20%26%20Icon/header-logo.svg',
  light: 'https://storage.googleapis.com/crown_money/Logo%20%26%20Icon/Crown%20Money%20Cropped%20Logo.png',
  favicon: 'https://storage.googleapis.com/crown_money/Logo%20%26%20Icon/favicon.png'
};

export const CHART_PALETTE = [
  '#250B40', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'
];

export const NAV_ITEMS = [
  { id: 'inputs', label: 'Client Data', icon: <Users size={20} /> },
  { id: 'dashboard', label: 'Review Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'projections', label: 'OOD Projections', icon: <LineChart size={20} /> },
  { id: 'steps', label: '12 Steps Track', icon: <CheckCircle2 size={20} /> },
  { id: 'export', label: 'Coach Export', icon: <Download size={20} /> }
];

export const BENCHMARKS = {
  AUS_SAVINGS_RATE: 5,
  CROWN_TARGET_RATE: 20
};

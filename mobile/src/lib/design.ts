import React from 'react';

// Mirrors the web's Tailwind color values exactly
export const W = {
  // Backgrounds
  pageBg:    '#f9fafb',   // bg-gray-50
  white:     '#ffffff',   // bg-white
  gray50:    '#f9fafb',
  gray100:   '#f3f4f6',
  gray200:   '#e5e7eb',

  // Text
  gray900:   '#111827',   // text-gray-900
  gray700:   '#374151',   // text-gray-700
  gray600:   '#4b5563',   // text-gray-600
  gray500:   '#6b7280',   // text-gray-500
  gray400:   '#9ca3af',   // text-gray-400

  // Borders
  gray100b:  '#f3f4f6',   // border-gray-100
  gray200b:  '#e5e7eb',   // border-gray-200

  // Accent — orange
  orange500: '#f97316',
  orange600: '#ea580c',
  orange50:  '#fff7ed',
  orange100: '#ffedd5',
  orange700: '#c2410c',

  // Status colours (matching web exactly)
  statusOpen:        { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' }, // orange-50/200/700
  statusInProgress:  { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' }, // blue-50/200/700
  statusClosed:      { bg: '#f3f4f6', border: '#e5e7eb', text: '#374151' }, // gray-100/200/700
  statusOnHold:      { bg: '#fefce8', border: '#fef08a', text: '#a16207' }, // yellow-50/200/700

  priorityCritical:  { bg: '#fef2f2', text: '#b91c1c' },  // red-50 / red-700
  priorityHigh:      { bg: '#fff7ed', text: '#c2410c' },  // orange-50 / orange-700
  priorityMedium:    { bg: '#fefce8', text: '#a16207' },  // yellow-50 / yellow-700
  priorityLow:       { bg: '#f0fdf4', text: '#15803d' },  // green-50 / green-700

  priorityBar: {
    critical: '#ef4444',
    high:     '#f97316',
    medium:   '#eab308',
    low:      '#22c55e',
  },

  assetActive:      { bg: '#f0fdf4', text: '#15803d' },
  assetMaintenance: { bg: '#fffbeb', text: '#b45309' },
  assetInactive:    { bg: '#f3f4f6', text: '#374151' },
  assetDisposed:    { bg: '#fef2f2', text: '#b91c1c' },
  assetStock:       { bg: '#eff6ff', text: '#1d4ed8' },
} as const;

// Shared card style — white, rounded-xl, shadow-sm, border-gray-100
export const card: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #f3f4f6',
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  padding: 16,
  marginBottom: 12,
};

// Input matching web: bg-gray-50, border-gray-200, focus ring orange-500
export const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#f9fafb',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 13,
  color: '#111827',
  outline: 'none',
};

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: '#374151',
  marginBottom: 6,
};

// Orange primary button — matches web's from-orange-500 to-red-600 style
export const primaryBtn: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  background: 'linear-gradient(to right, #f97316, #dc2626)',
  border: 'none',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  color: '#ffffff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  boxShadow: '0 4px 12px rgba(249,115,22,0.25)',
};

// Page header bar
export const stickyHeader: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  background: '#ffffff',
  borderBottom: '1px solid #f3f4f6',
  paddingTop: 'calc(env(safe-area-inset-top, 36px) + 14px)',
  paddingBottom: 12,
  paddingLeft: 16,
  paddingRight: 16,
};

// Section label (small caps inside cards)
export const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 10,
};

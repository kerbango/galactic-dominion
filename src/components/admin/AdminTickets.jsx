import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Ticket, Loader2, Send, CheckCircle2, RefreshCw, ChevronDown, ChevronUp, AlertCircle, Trash2 } from 'lucide-react';

const CATEGORIES = [
  { key: 'all', label: 'All Categories' },
  { key: 'bugs', label: 'Bug Report' },
  { key: 'name_change', label: 'Name Change' },
  { key: 'report_player', label: 'Report a Player' },
  { key: 'reset_account', label: 'Reset My Account' },
  { key: 'other', label: 'Other' },
];

const STATUSES = [
  { key: 'all', label: 'All Statuses' },
  { key: 'open', label: 'Open' },
import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { useLeadStore } from '../../stores/leadStore';

const STATUS_COLUMNS = [
  { id: 'New Lead', label: 'New Leads', color: '#3b82f6', bg: '#eff6ff' },
  { id: 'Initial Contact', label: 'Contacted', color: '#6366f1', bg: '#eef2ff' },
  { id: 'Qualification', label: 'Qualification', color: '#f59e0b', bg: '#fffbeb' },
  { id: 'Tech Call', label: 'Tech Call', color: '#8b5cf6', bg: '#f5f3ff' },
  { id: 'Site Visit', label: 'Site Visit', color: '#10b981', bg: '#ecfdf5' },
  { id: 'Proposal', label: 'Proposal Sent', color: '#f97316', bg: '#fff7ed' },
  { id: 'Won', label: 'Won', color: '#22c55e', bg: '#f0fdf4' },
  { id: 'Lost', label: 'Lost', color: '#ef4444', bg: '#fef2f2' },
];

const SortableLeadItem = ({ id, lead, col, onClick }: { id: number; lead: any; col: typeof STATUS_COLUMNS[0]; onClick: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: id.toString(),
    data: { type: 'Lead', lead },
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white rounded-xl p-3.5 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-200 transition-all group"
    >
      {/* Company initials + name */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: col.color }}>
            {(lead.company_name || 'L').charAt(0).toUpperCase()}
          </div>
          <h4 className="font-semibold text-xs text-gray-800 truncate">{lead.company_name}</h4>
        </div>
        {lead.ai_score != null && (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
            style={{ background: lead.ai_score >= 70 ? '#22c55e' : lead.ai_score >= 40 ? '#f59e0b' : '#94a3b8' }}
          >
            {lead.ai_score}
          </div>
        )}
      </div>
      <p className="text-[10px] text-gray-400 truncate mb-2">{lead.contact_person}</p>
      <div className="flex items-center justify-between">
        {lead.budget ? (
          <span className="text-[10px] font-bold text-gray-600">₹{Number(lead.budget).toLocaleString('en-IN')}</span>
        ) : <span />}
        {lead.assigned_to?.name && (
          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-700" title={lead.assigned_to.name}>
            {lead.assigned_to.name.charAt(0)}
          </div>
        )}
      </div>
      {/* View button */}
      <button
        className="w-full mt-2 py-1 text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 hover:bg-blue-50"
        onClick={(e) => { e.stopPropagation(); onClick(); }}
      >
        View Lead
      </button>
    </div>
  );
};

interface LeadKanbanProps { leads: any[] }

export const LeadKanban: React.FC<LeadKanbanProps> = ({ leads }) => {
  const navigate = useNavigate();
  const { updateLeadStatus } = useLeadStore();
  const [activeLead, setActiveLead] = useState<any | null>(null);
  const [columns, setColumns] = useState<Record<string, any[]>>(() => {
    const cols: Record<string, any[]> = {};
    STATUS_COLUMNS.forEach(c => { cols[c.id] = leads.filter(l => l.status === c.id); });
    return cols;
  });

  React.useEffect(() => {
    const cols: Record<string, any[]> = {};
    STATUS_COLUMNS.forEach(c => { cols[c.id] = leads.filter(l => l.status === c.id); });
    setColumns(cols);
  }, [leads]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveLead((event.active.data.current as any)?.lead);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    let activeColumn = '';
    for (const [col, items] of Object.entries(columns)) {
      if (items.some(i => i.id.toString() === activeId)) { activeColumn = col; break; }
    }
    let overColumn = STATUS_COLUMNS.find(c => c.id === overId)?.id || '';
    if (!overColumn) {
      for (const [col, items] of Object.entries(columns)) {
        if (items.some(i => i.id.toString() === overId)) { overColumn = col; break; }
      }
    }
    if (!activeColumn || !overColumn || activeColumn === overColumn) return;

    setColumns(prev => {
      const aItems = [...prev[activeColumn]];
      const oItems = [...prev[overColumn]];
      const lead = aItems.find(i => i.id.toString() === activeId);
      if (!lead) return prev;
      return {
        ...prev,
        [activeColumn]: aItems.filter(i => i.id.toString() !== activeId),
        [overColumn]: [...oItems, { ...lead, status: overColumn }],
      };
    });
    try { await updateLeadStatus(Number(activeId), overColumn); } catch { }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
        {STATUS_COLUMNS.map(col => (
          <div key={col.id} className="flex-shrink-0 w-64 flex flex-col rounded-xl overflow-hidden border border-gray-100 shadow-sm" style={{ background: col.bg }}>
            {/* Column Header */}
            <div className="px-3 py-3 flex items-center justify-between border-b border-black/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: col.color }}></div>
                <h3 className="text-xs font-bold text-gray-700">{col.label}</h3>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: col.color }}>
                {columns[col.id]?.length || 0}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-2">
              <SortableContext
                id={col.id}
                items={columns[col.id]?.map(l => l.id.toString()) || []}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2 min-h-[100px]">
                  {columns[col.id]?.map(lead => (
                    <SortableLeadItem
                      key={lead.id}
                      id={lead.id}
                      lead={lead}
                      col={col}
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    />
                  ))}
                  <div id={col.id} className="h-4" />
                </div>
              </SortableContext>
            </div>
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="bg-white rounded-xl p-3.5 shadow-2xl border border-blue-300 w-60 rotate-2">
            <p className="font-bold text-sm text-gray-800">{activeLead.company_name}</p>
            <p className="text-xs text-gray-400">{activeLead.contact_person}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

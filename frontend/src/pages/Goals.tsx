import { useState, useEffect } from 'react';
import { useGoals, type Goal } from '@/hooks/useGoals';
import { useProfile, type LifeArea } from '@/hooks/useProfile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Target, CheckCircle2, Circle, Clock, Pause,
  Trash2, Edit2, GripVertical, ArrowRight, X,
} from 'lucide-react';
import { selectHandler, sliderHandler } from '@/lib/ui-helpers';

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const COLUMNS = [
  { key: 'not_started', label: 'Not Started', icon: Circle, color: 'text-muted-foreground', border: 'border-border' },
  { key: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-blue-400', border: 'border-blue-500/30' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-green-400', border: 'border-green-500/30' },
  { key: 'paused', label: 'Paused', icon: Pause, color: 'text-yellow-400', border: 'border-yellow-500/30' },
] as const;

export default function Goals() {
  const { goals, loading, createGoal, updateGoal, deleteGoal, addMilestone, updateMilestone, deleteMilestone } = useGoals();
  const { data: profileData } = useProfile();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [draggedGoalId, setDraggedGoalId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const areas = profileData?.life_areas || [];

  // Keep selectedGoal in sync with goals array
  useEffect(() => {
    if (selectedGoal) {
      const fresh = goals.find(g => g.id === selectedGoal.id);
      if (fresh) {
        setSelectedGoal(fresh);
      } else {
        setSelectedGoal(null);
      }
    }
  }, [goals]);

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingGoal(null);
  };

  const moveGoal = (goalId: number, newStatus: string) => {
    const updates: Partial<Goal> & { progress?: number } = { status: newStatus };
    if (newStatus === 'completed') updates.progress = 100;
    updateGoal(goalId, updates);
  };

  const handleDragStart = (e: React.DragEvent, goalId: number) => {
    setDraggedGoalId(goalId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(goalId));
  };

  const handleDragOver = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTarget !== columnKey) setDropTarget(columnKey);
  };

  const handleDragLeave = (e: React.DragEvent, columnKey: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      if (dropTarget === columnKey) setDropTarget(null);
    }
  };

  const handleDrop = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    setDropTarget(null);
    if (draggedGoalId !== null) {
      const goal = goals.find(g => g.id === draggedGoalId);
      if (goal && goal.status !== columnKey) {
        moveGoal(draggedGoalId, columnKey);
      }
    }
    setDraggedGoalId(null);
  };

  const handleDragEnd = () => {
    setDraggedGoalId(null);
    setDropTarget(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="flex-1" />
        <Dialog open={showForm} onOpenChange={(open) => { if (!open) handleCloseForm(); else setShowForm(true); }}>
          <DialogTrigger render={<Button><Plus className="h-4 w-4 mr-2" /> New Goal</Button>} />
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGoal ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
            </DialogHeader>
            <GoalForm
              goal={editingGoal}
              areas={areas}
              onSave={async (data) => {
                if (editingGoal) {
                  await updateGoal(editingGoal.id, data);
                } else {
                  await createGoal(data);
                }
                handleCloseForm();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading goals...</div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Kanban columns */}
          <div className="flex-1 flex gap-4 overflow-x-auto pb-2">
            {COLUMNS.map(col => {
              const ColIcon = col.icon;
              const columnGoals = goals.filter(g => g.status === col.key)
                .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));
              return (
                <div
                  key={col.key}
                  className={`w-72 shrink-0 flex flex-col rounded-lg border ${col.border} bg-card/30 transition-colors ${dropTarget === col.key ? 'border-primary/60 bg-primary/5' : ''}`}
                  onDragOver={e => handleDragOver(e, col.key)}
                  onDragLeave={e => handleDragLeave(e, col.key)}
                  onDrop={e => handleDrop(e, col.key)}
                >
                  {/* Column header */}
                  <div className="px-3 py-2.5 border-b border-border/50 flex items-center gap-2">
                    <ColIcon className={`h-4 w-4 ${col.color}`} />
                    <span className="text-sm font-medium">{col.label}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">{columnGoals.length}</Badge>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {columnGoals.map(goal => {
                      const area = areas.find(a => a.id === goal.life_area_id);
                      const isSelected = selectedGoal?.id === goal.id;
                      return (
                        <Card
                          key={goal.id}
                          draggable
                          onDragStart={e => handleDragStart(e, goal.id)}
                          onDragEnd={handleDragEnd}
                          className={`border-border/50 bg-card cursor-grab active:cursor-grabbing ${draggedGoalId === goal.id ? 'opacity-40' : ''} ${isSelected ? 'ring-2 ring-primary' : ''}`}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-2">
                              <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground/30 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <button
                                  className="text-sm font-medium text-left w-full truncate hover:text-primary transition-colors"
                                  onClick={() => setSelectedGoal(isSelected ? null : goal)}
                                >
                                  {goal.title}
                                </button>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  {area && (
                                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                                      {area.icon} {area.name.split(' ')[0]}
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                                    {goal.priority}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Progress value={goal.progress} className="h-1 flex-1" />
                                  <span className="text-[10px] text-muted-foreground font-mono">{goal.progress}%</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {columnGoals.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground/40">
                        <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-xs">No goals</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side panel */}
          {selectedGoal && (
            <GoalDetailPanel
              goal={selectedGoal}
              areas={areas}
              onClose={() => setSelectedGoal(null)}
              onEdit={handleEdit}
              onMove={moveGoal}
              onDelete={deleteGoal}
              onAddMilestone={addMilestone}
              onUpdateMilestone={updateMilestone}
              onDeleteMilestone={deleteMilestone}
            />
          )}
        </div>
      )}
    </div>
  );
}

function GoalDetailPanel({ goal, areas, onClose, onEdit, onMove, onDelete, onAddMilestone, onUpdateMilestone, onDeleteMilestone }: {
  goal: Goal;
  areas: LifeArea[];
  onClose: () => void;
  onEdit: (goal: Goal) => void;
  onMove: (goalId: number, status: string) => void;
  onDelete: (goalId: number) => Promise<void>;
  onAddMilestone: (goalId: number, data: { title: string }) => Promise<void>;
  onUpdateMilestone: (goalId: number, milestoneId: number, updates: { is_completed?: boolean }) => Promise<void>;
  onDeleteMilestone: (goalId: number, milestoneId: number) => Promise<void>;
}) {
  const area = areas.find(a => a.id === goal.life_area_id);

  return (
    <div className="w-[400px] shrink-0 ml-4 border border-border rounded-lg bg-card flex flex-col overflow-hidden">
      {/* Sticky header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2 shrink-0">
        <h3 className="font-medium text-sm flex-1 truncate">{goal.title}</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(goal)}>
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{goal.status.replace('_', ' ')}</Badge>
          <Badge variant="outline">{goal.priority}</Badge>
          {area && <Badge variant="outline">{area.icon} {area.name}</Badge>}
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-mono">{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} className="h-2" />
        </div>

        {/* Description */}
        {goal.description && (
          <div>
            <Label className="text-xs text-muted-foreground">Description</Label>
            <p className="text-sm mt-1">{goal.description}</p>
          </div>
        )}

        {/* Purpose */}
        {goal.purpose_why && (
          <div>
            <Label className="text-xs text-muted-foreground">Purpose / Why</Label>
            <p className="text-sm mt-1 italic">{goal.purpose_why}</p>
          </div>
        )}

        {/* Target date */}
        {goal.target_date && (
          <div>
            <Label className="text-xs text-muted-foreground">Target Date</Label>
            <p className="text-sm mt-1">{goal.target_date}</p>
          </div>
        )}

        {/* Milestones */}
        <div>
          <Label className="text-xs text-muted-foreground">Milestones</Label>
          <div className="mt-2 space-y-1.5">
            {goal.milestones.map(m => (
              <div key={m.id} className="flex items-center gap-2 text-sm">
                <button onClick={() => onUpdateMilestone(goal.id, m.id, { is_completed: !m.is_completed })}>
                  {m.is_completed
                    ? <CheckCircle2 className="h-4 w-4 text-primary" />
                    : <Circle className="h-4 w-4 text-muted-foreground" />
                  }
                </button>
                <span className={`flex-1 ${m.is_completed ? 'line-through text-muted-foreground' : ''}`}>{m.title}</span>
                <button onClick={() => onDeleteMilestone(goal.id, m.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {goal.milestones.length === 0 && (
              <p className="text-xs text-muted-foreground">No milestones yet.</p>
            )}
          </div>
          <MilestoneAdder goalId={goal.id} onAdd={onAddMilestone} />
        </div>

        {/* Move actions */}
        <div>
          <Label className="text-xs text-muted-foreground">Move To</Label>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {goal.status !== 'in_progress' && (
              <Button size="sm" variant="outline" className="text-xs" onClick={() => onMove(goal.id, 'in_progress')}>
                <ArrowRight className="h-3 w-3 mr-1" /> Start
              </Button>
            )}
            {goal.status !== 'completed' && (
              <Button size="sm" variant="outline" className="text-xs" onClick={() => onMove(goal.id, 'completed')}>
                <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
              </Button>
            )}
            {goal.status === 'in_progress' && (
              <Button size="sm" variant="outline" className="text-xs" onClick={() => onMove(goal.id, 'paused')}>
                <Pause className="h-3 w-3 mr-1" /> Pause
              </Button>
            )}
            {goal.status === 'paused' && (
              <Button size="sm" variant="outline" className="text-xs" onClick={() => onMove(goal.id, 'in_progress')}>
                <ArrowRight className="h-3 w-3 mr-1" /> Resume
              </Button>
            )}
            {goal.status !== 'not_started' && (
              <Button size="sm" variant="outline" className="text-xs" onClick={() => onMove(goal.id, 'not_started')}>
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Delete */}
        <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive" onClick={() => onDelete(goal.id)}>
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Goal
        </Button>
      </div>
    </div>
  );
}

function GoalForm({ goal, areas, onSave }: { goal: Goal | null; areas: LifeArea[]; onSave: (data: Partial<Goal>) => Promise<void> }) {
  const [title, setTitle] = useState(goal?.title || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [lifeAreaId, setLifeAreaId] = useState(String(goal?.life_area_id || areas[0]?.id || ''));
  const [goalType, setGoalType] = useState(goal?.goal_type || 'outcome');
  const [purposeWhy, setPurposeWhy] = useState(goal?.purpose_why || '');
  const [identityStatement, setIdentityStatement] = useState(goal?.identity_statement || '');
  const [commitmentLevel, setCommitmentLevel] = useState(goal?.commitment_level || 7);
  const [weeklyHours, setWeeklyHours] = useState(String(goal?.estimated_weekly_hours || ''));
  const [priority, setPriority] = useState(goal?.priority || 'medium');
  const [targetDate, setTargetDate] = useState(goal?.target_date || '');
  const [progress, setProgress] = useState(goal?.progress || 0);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      title, description, life_area_id: Number(lifeAreaId), goal_type: goalType,
      purpose_why: purposeWhy, identity_statement: identityStatement || null,
      commitment_level: commitmentLevel,
      estimated_weekly_hours: weeklyHours ? Number(weeklyHours) : null,
      priority, target_date: targetDate || null,
      ...(goal ? { progress } : {}),
    });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="What do you want to achieve?" />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe this goal..." rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Life Area</Label>
          <Select value={lifeAreaId} onValueChange={selectHandler(setLifeAreaId)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {areas.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.icon} {a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Type</Label>
          <Select value={goalType} onValueChange={selectHandler(setGoalType)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="outcome">Outcome</SelectItem>
              <SelectItem value="process">Process</SelectItem>
              <SelectItem value="identity">Identity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Purpose / Why (RPM)</Label>
        <Textarea value={purposeWhy} onChange={e => setPurposeWhy(e.target.value)} placeholder="Why does this matter to you emotionally?" rows={2} />
      </div>
      <div>
        <Label>Identity Statement</Label>
        <Input value={identityStatement} onChange={e => setIdentityStatement(e.target.value)} placeholder="I am the type of person who..." />
      </div>
      <div>
        <Label>Commitment Level: {commitmentLevel}/10</Label>
        <Slider value={[commitmentLevel]} onValueChange={sliderHandler(setCommitmentLevel)} min={1} max={10} step={1} className="mt-2" />
      </div>
      {goal && (
        <div>
          <Label>Progress: {progress}%</Label>
          <Slider value={[progress]} onValueChange={sliderHandler(setProgress)} min={0} max={100} step={5} className="mt-2" />
        </div>
      )}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Priority</Label>
          <Select value={priority} onValueChange={selectHandler(setPriority)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Weekly Hours</Label>
          <Input type="number" value={weeklyHours} onChange={e => setWeeklyHours(e.target.value)} placeholder="0" />
        </div>
        <div>
          <Label>Target Date</Label>
          <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
        </div>
      </div>
      <Button onClick={handleSave} className="w-full" disabled={!title.trim() || saving}>
        {goal ? 'Update Goal' : 'Create Goal'}
      </Button>
    </div>
  );
}

function MilestoneAdder({ goalId, onAdd }: { goalId: number; onAdd: (goalId: number, data: { title: string }) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground mt-2" onClick={() => setShow(true)}>
        <Plus className="h-3 w-3 mr-1" /> Add milestone
      </Button>
    );
  }

  return (
    <div className="flex gap-1.5 mt-2">
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Milestone..."
        className="h-7 text-xs"
        onKeyDown={e => {
          if (e.key === 'Enter' && title.trim()) {
            onAdd(goalId, { title: title.trim() });
            setTitle('');
          }
        }}
      />
      <Button size="sm" className="h-7 text-xs px-2" onClick={() => { if (title.trim()) { onAdd(goalId, { title: title.trim() }); setTitle(''); } }}>
        Add
      </Button>
    </div>
  );
}

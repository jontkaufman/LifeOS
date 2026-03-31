import { useState } from 'react';
import { useGoals, type Goal } from '@/hooks/useGoals';
import { useProfile, type LifeArea } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ChevronDown, ChevronUp, Trash2, Edit2,
} from 'lucide-react';
import { selectHandler, sliderHandler } from '@/lib/ui-helpers';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Target }> = {
  not_started: { label: 'Not Started', color: 'text-muted-foreground', icon: Circle },
  in_progress: { label: 'In Progress', color: 'text-blue-400', icon: Clock },
  completed: { label: 'Completed', color: 'text-green-400', icon: CheckCircle2 },
  paused: { label: 'Paused', color: 'text-yellow-400', icon: Pause },
  abandoned: { label: 'Abandoned', color: 'text-red-400', icon: Trash2 },
};

export default function Goals() {
  const { goals, loading, createGoal, updateGoal, deleteGoal, addMilestone, updateMilestone, deleteMilestone } = useGoals();
  const { data: profileData } = useProfile();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<number | null>(null);
  const [filterArea, setFilterArea] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('active');

  const areas = profileData?.life_areas || [];

  const filteredGoals = goals.filter(g => {
    if (filterArea !== 'all' && g.life_area_id !== Number(filterArea)) return false;
    if (filterStatus === 'active' && ['completed', 'abandoned'].includes(g.status)) return false;
    if (filterStatus !== 'all' && filterStatus !== 'active' && g.status !== filterStatus) return false;
    return true;
  });

  // Group by life area
  const grouped = new Map<number, Goal[]>();
  filteredGoals.forEach(g => {
    const list = grouped.get(g.life_area_id) || [];
    list.push(g);
    grouped.set(g.life_area_id, list);
  });

  return (
    <div className="space-y-6">
      {/* Filters & Actions */}
      <div className="flex items-center gap-3">
        <Select value={filterStatus} onValueChange={selectHandler(setFilterStatus)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="not_started">Not Started</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterArea} onValueChange={selectHandler(setFilterArea)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Areas" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Areas</SelectItem>
            {areas.map(a => (
              <SelectItem key={a.id} value={String(a.id)}>{a.icon} {a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Dialog open={showForm} onOpenChange={setShowForm}>
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
                setShowForm(false);
                setEditingGoal(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading goals...</div>
      ) : filteredGoals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">No goals yet. Create your first goal to get started!</p>
          </CardContent>
        </Card>
      ) : (
        Array.from(grouped.entries()).map(([areaId, areaGoals]) => {
          const area = areas.find(a => a.id === areaId);
          return (
            <div key={areaId}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <span>{area?.icon || '📌'}</span>
                <span>{area?.name || 'Uncategorized'}</span>
                <Badge variant="outline" className="text-xs">{areaGoals.length}</Badge>
              </h3>
              <div className="space-y-3">
                {areaGoals.map(goal => {
                  const expanded = expandedGoal === goal.id;
                  const statusConfig = STATUS_CONFIG[goal.status] || STATUS_CONFIG.not_started;
                  const StatusIcon = statusConfig.icon;
                  return (
                    <Card key={goal.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <StatusIcon className={`h-5 w-5 mt-0.5 shrink-0 ${statusConfig.color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">{goal.title}</h4>
                              <Badge variant="outline" className="text-[10px]">{goal.priority}</Badge>
                              <Badge variant="outline" className="text-[10px]">{goal.goal_type}</Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Progress value={goal.progress} className="h-1.5 flex-1" />
                              <span className="text-xs text-muted-foreground font-mono">{goal.progress}%</span>
                            </div>
                            {goal.purpose_why && (
                              <p className="text-xs text-muted-foreground mt-1 italic">Why: {goal.purpose_why}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingGoal(goal); setShowForm(true); }}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedGoal(expanded ? null : goal.id)}>
                              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>

                        {expanded && (
                          <div className="mt-4 pt-4 border-t border-border space-y-3">
                            {goal.description && <p className="text-sm">{goal.description}</p>}
                            {goal.identity_statement && (
                              <p className="text-sm text-primary italic">"{goal.identity_statement}"</p>
                            )}
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Commitment:</span>
                                <span className="ml-1 font-mono">{goal.commitment_level}/10</span>
                              </div>
                              {goal.estimated_weekly_hours && (
                                <div>
                                  <span className="text-muted-foreground">Weekly hours:</span>
                                  <span className="ml-1 font-mono">{goal.estimated_weekly_hours}h</span>
                                </div>
                              )}
                              {goal.target_date && (
                                <div>
                                  <span className="text-muted-foreground">Target:</span>
                                  <span className="ml-1">{goal.target_date}</span>
                                </div>
                              )}
                            </div>

                            {/* Milestones */}
                            <div>
                              <h5 className="text-sm font-medium mb-2">Milestones</h5>
                              <div className="space-y-1">
                                {goal.milestones.map(m => (
                                  <div key={m.id} className="flex items-center gap-2 text-sm">
                                    <button onClick={() => updateMilestone(goal.id, m.id, { is_completed: !m.is_completed })}>
                                      {m.is_completed
                                        ? <CheckCircle2 className="h-4 w-4 text-primary" />
                                        : <Circle className="h-4 w-4 text-muted-foreground" />
                                      }
                                    </button>
                                    <span className={m.is_completed ? 'line-through text-muted-foreground' : ''}>{m.title}</span>
                                    <button onClick={() => deleteMilestone(goal.id, m.id)} className="ml-auto text-muted-foreground hover:text-destructive">
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <MilestoneAdder goalId={goal.id} onAdd={addMilestone} />
                            </div>

                            {/* Status actions */}
                            <div className="flex gap-2">
                              {goal.status !== 'completed' && (
                                <Button size="sm" variant="outline" onClick={() => updateGoal(goal.id, { status: 'completed', progress: 100 })}>
                                  Mark Complete
                                </Button>
                              )}
                              {goal.status === 'in_progress' && (
                                <Button size="sm" variant="outline" onClick={() => updateGoal(goal.id, { status: 'paused' })}>
                                  Pause
                                </Button>
                              )}
                              {['not_started', 'paused'].includes(goal.status) && (
                                <Button size="sm" variant="outline" onClick={() => updateGoal(goal.id, { status: 'in_progress' })}>
                                  Start / Resume
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="text-destructive ml-auto" onClick={() => deleteGoal(goal.id)}>
                                <Trash2 className="h-3 w-3 mr-1" /> Delete
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
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
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Priority</Label>
          <Select value={priority} onValueChange={selectHandler(setPriority)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
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
      <Button onClick={() => onSave({
        title, description, life_area_id: Number(lifeAreaId), goal_type: goalType,
        purpose_why: purposeWhy, identity_statement: identityStatement || null,
        commitment_level: commitmentLevel,
        estimated_weekly_hours: weeklyHours ? Number(weeklyHours) : null,
        priority, target_date: targetDate || null,
      })} className="w-full" disabled={!title.trim()}>
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
      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground mt-1" onClick={() => setShow(true)}>
        <Plus className="h-3 w-3 mr-1" /> Add milestone
      </Button>
    );
  }

  return (
    <div className="flex gap-2 mt-2">
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Milestone title..."
        className="h-8 text-sm"
        onKeyDown={e => {
          if (e.key === 'Enter' && title.trim()) {
            onAdd(goalId, { title: title.trim() });
            setTitle('');
          }
        }}
      />
      <Button size="sm" className="h-8" onClick={() => { if (title.trim()) { onAdd(goalId, { title: title.trim() }); setTitle(''); } }}>
        Add
      </Button>
    </div>
  );
}

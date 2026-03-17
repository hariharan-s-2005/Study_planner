import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Plus, Trash2, CheckCircle2, Clock, Trophy } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

type GoalType = "daily" | "weekly";

interface GoalRow {
  id: string;
  goal_type: GoalType | null;
  target_hours: number;
  period_start: string;
  period_end: string;
  created_at: string;
}

function getDateRange(type: GoalType): { start: string; end: string } {
  const today = new Date();
  if (type === "daily") {
    const d = today.toISOString().split("T")[0];
    return { start: d, end: d };
  }
  const day = today.getDay();
  const mon = new Date(today); mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { start: mon.toISOString().split("T")[0], end: sun.toISOString().split("T")[0] };
}

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<GoalRow[]>([]);
  const [pomodoroHours, setPomodoroHours] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ goal_type: "daily" as GoalType, target_hours: "2" });

  const fetchData = async () => {
    if (!user) return;
    const [goalsRes, pomRes] = await Promise.all([
      supabase.from("goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("pomodoro_sessions").select("duration, completed_at").eq("user_id", user.id),
    ]);
    setGoals((goalsRes.data || []) as GoalRow[]);

    // Build hours by date for progress calculation
    const byDate: Record<string, number> = {};
    (pomRes.data || []).forEach((s: any) => {
      const d = s.completed_at.split("T")[0];
      byDate[d] = (byDate[d] || 0) + s.duration / 3600;
    });
    setPomodoroHours(byDate);
  };

  useEffect(() => { fetchData(); }, [user]);

  const getProgress = (goal: GoalRow): number => {
    if (!goal.goal_type) return 0;
    const start = new Date(goal.period_start);
    const end = new Date(goal.period_end);
    let total = 0;
    const current = new Date(start);
    while (current <= end) {
      const key = current.toISOString().split("T")[0];
      total += pomodoroHours[key] || 0;
      current.setDate(current.getDate() + 1);
    }
    return Math.min(Math.round((total / goal.target_hours) * 100), 100);
  };

  const handleAdd = async () => {
    if (!user) return;
    setLoading(true);
    const range = getDateRange(form.goal_type);
    const { error } = await supabase.from("goals").insert({
      user_id: user.id,
      goal_type: form.goal_type,
      target_hours: Number(form.target_hours),
      period_start: range.start,
      period_end: range.end,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Goal created!");
    setOpen(false);
    setForm({ goal_type: "daily", target_hours: "2" });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Goal removed!");
    fetchData();
  };

  const activeGoals = goals.filter((g) => {
    const today = new Date().toISOString().split("T")[0];
    return g.period_end >= today;
  });
  const pastGoals = goals.filter((g) => {
    const today = new Date().toISOString().split("T")[0];
    return g.period_end < today;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Goals</h1>
          <p className="text-muted-foreground mt-1">Set and track your study hour goals</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />New Goal</Button>
          </DialogTrigger>
          <DialogContent className="glass">
            <DialogHeader>
              <DialogTitle className="font-display">Create Study Goal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Goal Type</Label>
                <Select value={form.goal_type} onValueChange={(v) => setForm({ ...form, goal_type: v as GoalType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily Goal</SelectItem>
                    <SelectItem value="weekly">Weekly Goal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Hours</Label>
                <Input type="number" min="0.5" max="24" step="0.5" value={form.target_hours}
                  onChange={(e) => setForm({ ...form, target_hours: e.target.value })} />
                <p className="text-xs text-muted-foreground">
                  Period: {getDateRange(form.goal_type).start === getDateRange(form.goal_type).end
                    ? getDateRange(form.goal_type).start
                    : `${getDateRange(form.goal_type).start} to ${getDateRange(form.goal_type).end}`}
                </p>
              </div>
              <Button className="w-full gradient-primary text-primary-foreground" onClick={handleAdd} disabled={loading}>
                {loading ? "Creating..." : "Create Goal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Goals */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Target className="h-5 w-5 text-primary" />Active Goals</h2>
        {activeGoals.length === 0 ? (
          <Card className="glass">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No active goals</p>
              <p className="text-sm text-muted-foreground">Create a goal to stay motivated!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeGoals.map((g, i) => {
              const pct = getProgress(g);
              const achieved = pct >= 100;
              return (
                <motion.div key={g.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className={`glass ${achieved ? "border-success/50" : ""}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {achieved ? <Trophy className="h-5 w-5 text-yellow-500" /> : <Clock className="h-5 w-5 text-primary" />}
                          <CardTitle className="font-display text-base capitalize">{g.goal_type} Goal</CardTitle>
                        </div>
                        <div className="flex items-center gap-2">
                          {achieved && <Badge className="bg-success/20 text-success border-success/30">Achieved!</Badge>}
                          <Badge variant="outline" className="capitalize">{g.goal_type}</Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(g.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        {g.period_start === g.period_end ? g.period_start : `${g.period_start} → ${g.period_end}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{pct}% of {g.target_hours}h target</span>
                      </div>
                      <Progress value={pct} className="h-3" />
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Goals */}
      {pastGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-muted-foreground" />Past Goals</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {pastGoals.map((g) => {
              const pct = getProgress(g);
              return (
                <Card key={g.id} className="glass opacity-70">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">{g.goal_type} Goal — {g.target_hours}h</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={pct >= 100 ? "default" : "outline"} className={pct >= 100 ? "bg-success text-success-foreground" : ""}>
                          {pct >= 100 ? "✓ Done" : `${pct}%`}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(g.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{g.period_start} → {g.period_end}</p>
                    <Progress value={pct} className="h-2 mt-2" />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

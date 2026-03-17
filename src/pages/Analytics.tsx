import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Clock, BookOpen, Target, TrendingUp, Flame, CheckCircle2, CircleDot } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

const COLORS = ["#6366f1","#8b5cf6","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#14b8a6"];
const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function BarChart({ data, max, color = "#6366f1" }: { data: number[]; max: number; color?: string }) {
  return (
    <div className="flex items-end gap-1 h-28 w-full">
      {data.map((v, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-1">
          <div
            className="w-full rounded-t transition-all duration-500"
            style={{ height: max > 0 ? `${(v / max) * 100}%` : "4px", minHeight: 4, background: color, opacity: v === 0 ? 0.2 : 1 }}
          />
          <span className="text-[10px] text-muted-foreground">{DAY_LABELS[i]}</span>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ pct, color = "#6366f1", size = 80 }: { pct: number; color?: string; size?: number }) {
  const r = 30; const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" className="-rotate-90">
      <circle cx="40" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/30" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${(pct / 100) * c} ${c}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.8s ease" }} />
    </svg>
  );
}

export default function Analytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [weekSessions, setWeekSessions] = useState<number[]>(Array(7).fill(0));
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [streak, setStreak] = useState<any>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
      const weekStr = weekAgo.toISOString().split("T")[0];

      const [pomRes, subRes, topRes, streakRes] = await Promise.all([
        supabase.from("pomodoro_sessions").select("*").eq("user_id", user.id).gte("completed_at", weekStr).order("completed_at"),
        supabase.from("subjects").select("id, name, color").eq("user_id", user.id),
        supabase.from("topics").select("id, status, subject_id, estimated_hours").eq("user_id", user.id),
        supabase.from("user_streaks").select("*").eq("user_id", user.id).single(),
      ]);

      const sessions = pomRes.data || [];
      setRecentSessions(sessions.slice(-10).reverse());

      // Week buckets (last 7 days index 0=oldest, 6=today reversed to Sun-Sat)
      const today = new Date();
      const buckets = Array(7).fill(0);
      sessions.forEach((s: any) => {
        const d = new Date(s.completed_at);
        const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
        if (diff >= 0 && diff < 7) {
          const dayOfWeek = d.getDay();
          buckets[dayOfWeek] += Math.round(s.duration / 60);
        }
      });
      setWeekSessions(buckets);
      setTotalMinutes(sessions.reduce((a: number, s: any) => a + s.duration, 0));
      setSubjects(subRes.data || []);
      setTopics(topRes.data || []);
      setStreak(streakRes.data);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const completedTopics = topics.filter((t) => t.status === "completed").length;
  const totalTopics = topics.length;
  const completionPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
  const maxBucket = Math.max(...weekSessions, 1);

  const subjectBreakdown = subjects.map((s) => {
    const sTopics = topics.filter((t) => t.subject_id === s.id);
    const done = sTopics.filter((t) => t.status === "completed").length;
    return { ...s, total: sTopics.length, done, pct: sTopics.length > 0 ? Math.round((done / sTopics.length) * 100) : 0 };
  }).sort((a, b) => b.total - a.total);

  const statCards = [
    { label: "Study Hours (Week)", value: `${totalHours}h`, icon: Clock, color: "text-primary" },
    { label: "Topics Completed", value: `${completedTopics}/${totalTopics}`, icon: CheckCircle2, color: "text-success" },
    { label: "Current Streak", value: `${streak?.current_streak ?? 0} days`, icon: Flame, color: "text-warning" },
    { label: "Total Points", value: streak?.points ?? 0, icon: TrendingUp, color: "text-accent" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your study progress and performance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="glass">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-display font-bold mt-1">{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color} opacity-80`} />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Weekly Pomodoro Chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass h-full">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" /> Weekly Study Minutes
              </CardTitle>
              <CardDescription>Pomodoro minutes by day of week</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-28 animate-pulse bg-muted rounded" />
              ) : (
                <BarChart data={weekSessions} max={maxBucket} />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Overall completion donut */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="glass h-full">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Topic Completion
              </CardTitle>
              <CardDescription>Overall curriculum progress</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <div className="relative flex-shrink-0">
                <DonutChart pct={completionPct} />
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold font-display rotate-90" style={{ transform: "none" }}>
                  {completionPct}%
                </span>
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium">{completedTopics} completed</p>
                <p className="text-sm text-muted-foreground">{totalTopics - completedTopics} remaining</p>
                <Progress value={completionPct} className="h-2 mt-2" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Subject Breakdown */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card className="glass">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Subject Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subjectBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No subjects yet. Add subjects to see breakdown.</p>
            ) : (
              <div className="space-y-4">
                {subjectBreakdown.map((s, i) => (
                  <div key={s.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ background: s.color || COLORS[i % COLORS.length] }} />
                        <span className="text-sm font-medium">{s.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{s.done}/{s.total} topics</Badge>
                        <span className="text-xs font-bold w-10 text-right">{s.pct}%</span>
                      </div>
                    </div>
                    <Progress value={s.pct} className="h-2" style={{ "--progress-bg": s.color } as any} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Pomodoro Sessions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Card className="glass">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <CircleDot className="h-5 w-5 text-primary" /> Recent Pomodoro Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No sessions this week. Start a Pomodoro timer!</p>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{Math.round(s.duration / 60)} min session</p>
                        <p className="text-xs text-muted-foreground">{new Date(s.completed_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{Math.round(s.duration / 60)}m</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

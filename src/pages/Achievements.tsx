import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, Target, Star, BookOpen, Clock, Zap, Award, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  unlocked: boolean;
  progress?: number;
  max?: number;
  badge?: string;
}

export default function Achievements() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    streak: 0, longestStreak: 0, points: 0, subjects: 0,
    completedTopics: 0, totalTopics: 0, pomodoroSessions: 0,
    pomodoroMinutes: 0, notes: 0,
  });

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [streakRes, subRes, topRes, pomRes, notesRes] = await Promise.all([
        supabase.from("user_streaks").select("*").eq("user_id", user.id).single(),
        supabase.from("subjects").select("id").eq("user_id", user.id),
        supabase.from("topics").select("id, status").eq("user_id", user.id),
        supabase.from("pomodoro_sessions").select("duration").eq("user_id", user.id),
        supabase.from("notes").select("id").eq("user_id", user.id),
      ]);
      const topics = topRes.data || [];
      const sessions = pomRes.data || [];
      setStats({
        streak: streakRes.data?.current_streak ?? 0,
        longestStreak: streakRes.data?.longest_streak ?? 0,
        points: streakRes.data?.points ?? 0,
        subjects: subRes.data?.length ?? 0,
        completedTopics: topics.filter((t: any) => t.status === "completed").length,
        totalTopics: topics.length,
        pomodoroSessions: sessions.length,
        pomodoroMinutes: Math.round(sessions.reduce((a: number, s: any) => a + s.duration, 0) / 60),
        notes: notesRes.data?.length ?? 0,
      });
      setLoading(false);
    };
    fetch();
  }, [user]);

  const achievements: Achievement[] = [
    {
      id: "first_subject",
      title: "First Steps",
      description: "Add your first subject",
      icon: BookOpen, color: "text-blue-500", bgColor: "bg-blue-500/10",
      unlocked: stats.subjects >= 1, badge: "Beginner",
    },
    {
      id: "five_subjects",
      title: "Scholar",
      description: "Add 5 subjects",
      icon: BookOpen, color: "text-indigo-500", bgColor: "bg-indigo-500/10",
      unlocked: stats.subjects >= 5, progress: stats.subjects, max: 5,
    },
    {
      id: "first_topic",
      title: "Topic Tackler",
      description: "Complete your first topic",
      icon: Target, color: "text-green-500", bgColor: "bg-green-500/10",
      unlocked: stats.completedTopics >= 1,
    },
    {
      id: "ten_topics",
      title: "Knowledge Seeker",
      description: "Complete 10 topics",
      icon: Target, color: "text-emerald-500", bgColor: "bg-emerald-500/10",
      unlocked: stats.completedTopics >= 10, progress: stats.completedTopics, max: 10,
    },
    {
      id: "fifty_topics",
      title: "Master Learner",
      description: "Complete 50 topics",
      icon: Trophy, color: "text-yellow-500", bgColor: "bg-yellow-500/10",
      unlocked: stats.completedTopics >= 50, progress: stats.completedTopics, max: 50,
    },
    {
      id: "streak_3",
      title: "Consistent",
      description: "Maintain a 3-day study streak",
      icon: Flame, color: "text-orange-500", bgColor: "bg-orange-500/10",
      unlocked: stats.streak >= 3, progress: stats.streak, max: 3,
    },
    {
      id: "streak_7",
      title: "Weekly Warrior",
      description: "Maintain a 7-day study streak",
      icon: Flame, color: "text-red-500", bgColor: "bg-red-500/10",
      unlocked: stats.streak >= 7, progress: stats.streak, max: 7, badge: "Fire!",
    },
    {
      id: "streak_30",
      title: "Unstoppable",
      description: "Maintain a 30-day study streak",
      icon: Flame, color: "text-rose-600", bgColor: "bg-rose-600/10",
      unlocked: stats.streak >= 30, progress: stats.streak, max: 30,
    },
    {
      id: "pomodoro_5",
      title: "Focus Mode",
      description: "Complete 5 Pomodoro sessions",
      icon: Clock, color: "text-purple-500", bgColor: "bg-purple-500/10",
      unlocked: stats.pomodoroSessions >= 5, progress: stats.pomodoroSessions, max: 5,
    },
    {
      id: "pomodoro_50",
      title: "Deep Worker",
      description: "Complete 50 Pomodoro sessions",
      icon: Clock, color: "text-violet-600", bgColor: "bg-violet-600/10",
      unlocked: stats.pomodoroSessions >= 50, progress: stats.pomodoroSessions, max: 50,
    },
    {
      id: "points_100",
      title: "Point Collector",
      description: "Earn 100 points",
      icon: Star, color: "text-amber-500", bgColor: "bg-amber-500/10",
      unlocked: stats.points >= 100, progress: stats.points, max: 100,
    },
    {
      id: "points_500",
      title: "High Achiever",
      description: "Earn 500 points",
      icon: Star, color: "text-yellow-600", bgColor: "bg-yellow-600/10",
      unlocked: stats.points >= 500, progress: stats.points, max: 500,
    },
    {
      id: "notes_5",
      title: "Note Taker",
      description: "Create 5 notes",
      icon: Zap, color: "text-cyan-500", bgColor: "bg-cyan-500/10",
      unlocked: stats.notes >= 5, progress: stats.notes, max: 5,
    },
    {
      id: "streak_longest",
      title: "Record Breaker",
      description: "Set a longest streak of 14+ days",
      icon: Award, color: "text-pink-500", bgColor: "bg-pink-500/10",
      unlocked: stats.longestStreak >= 14, progress: stats.longestStreak, max: 14,
    },
  ];

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Achievements</h1>
        <p className="text-muted-foreground mt-1">Your learning milestones and badges</p>
      </div>

      {/* Summary bar */}
      <Card className="glass">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 sm:gap-8 items-center">
          <div className="text-center">
            <p className="text-4xl font-display font-bold text-gradient">{unlocked.length}</p>
            <p className="text-sm text-muted-foreground">Unlocked</p>
          </div>
          <div className="flex-1 w-full">
            <div className="flex justify-between text-sm mb-1">
              <span>Overall Progress</span>
              <span className="font-medium">{unlocked.length}/{achievements.length}</span>
            </div>
            <Progress value={Math.round((unlocked.length / achievements.length) * 100)} className="h-3" />
          </div>
          <div className="text-center">
            <p className="text-4xl font-display font-bold">{achievements.length - unlocked.length}</p>
            <p className="text-sm text-muted-foreground">Remaining</p>
          </div>
        </CardContent>
      </Card>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" />Unlocked ({unlocked.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {unlocked.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}>
                <Card className="glass border-primary/20 hover:border-primary/40 transition-colors">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 ${a.bgColor}`}>
                      <a.icon className={`h-6 w-6 ${a.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{a.title}</p>
                        {a.badge && <Badge className="text-[10px] px-1.5 py-0">{a.badge}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{a.description}</p>
                    </div>
                    <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Lock className="h-5 w-5 text-muted-foreground" />In Progress ({locked.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {locked.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="glass opacity-60 hover:opacity-80 transition-opacity">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 flex-shrink-0">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{a.title}</p>
                      <p className="text-xs text-muted-foreground mb-1">{a.description}</p>
                      {a.max !== undefined && (
                        <div>
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                            <span>{a.progress ?? 0} / {a.max}</span>
                            <span>{Math.round(((a.progress ?? 0) / a.max) * 100)}%</span>
                          </div>
                          <Progress value={Math.round(((a.progress ?? 0) / a.max) * 100)} className="h-1.5" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="glass"><CardContent className="p-4 h-20 animate-pulse bg-muted/30 rounded" /></Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Shield, Users, BookOpen, Target, Clock, TrendingUp, Activity,
  AlertTriangle, CheckCircle2, Database, Flame, BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface UserStat {
  user_id: string;
  name: string | null;
  email: string;
  subjects: number;
  topics: number;
  completedTopics: number;
  pomodoroSessions: number;
  streak: number;
  points: number;
  joinedAt: string;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [authorized, setAuthorized] = useState<null | boolean>(null);
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0, totalSubjects: 0, totalTopics: 0,
    completedTopics: 0, totalNotes: 0, totalPomodoro: 0,
    totalGoals: 0, totalPomodoroMinutes: 0,
  });
  const [userStats, setUserStats] = useState<UserStat[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadAdmin = async () => {
      // Check if admin: fetch all profiles to see if user is first/only user
      const { data: profiles, error: profileErr } = await supabase
        .from("profiles").select("user_id, name, created_at").order("created_at");

      if (profileErr || !profiles) { setAuthorized(false); setLoading(false); return; }

      // Admin = first user OR email contains "admin"
      const isAdmin = profiles[0]?.user_id === user.id || user.email?.includes("admin");
      setAuthorized(!!isAdmin);

      if (!isAdmin) { setLoading(false); return; }

      // Load all system data
      const [subRes, topRes, notesRes, pomRes, goalsRes, streakRes] = await Promise.all([
        supabase.from("subjects").select("id, user_id"),
        supabase.from("topics").select("id, status, user_id"),
        supabase.from("notes").select("id, user_id"),
        supabase.from("pomodoro_sessions").select("id, duration, user_id"),
        supabase.from("goals").select("id, user_id"),
        supabase.from("user_streaks").select("user_id, current_streak, points"),
      ]);

      const allSubjects = subRes.data || [];
      const allTopics = topRes.data || [];
      const allNotes = notesRes.data || [];
      const allPom = pomRes.data || [];
      const allGoals = goalsRes.data || [];
      const allStreaks = streakRes.data || [];

      setSystemStats({
        totalUsers: profiles.length,
        totalSubjects: allSubjects.length,
        totalTopics: allTopics.length,
        completedTopics: allTopics.filter((t: any) => t.status === "completed").length,
        totalNotes: allNotes.length,
        totalPomodoro: allPom.length,
        totalGoals: allGoals.length,
        totalPomodoroMinutes: Math.round(allPom.reduce((a: number, s: any) => a + s.duration, 0) / 60),
      });

      // Build per-user stats (use auth emails from profiles)
      const stats: UserStat[] = profiles.map((p) => {
        const uid = p.user_id;
        const sTopics = allTopics.filter((t: any) => t.user_id === uid);
        const streak = allStreaks.find((s: any) => s.user_id === uid);
        return {
          user_id: uid,
          name: p.name,
          email: uid.slice(0, 8) + "…",   // mask for privacy in demo
          subjects: allSubjects.filter((s: any) => s.user_id === uid).length,
          topics: sTopics.length,
          completedTopics: sTopics.filter((t: any) => t.status === "completed").length,
          pomodoroSessions: allPom.filter((s: any) => s.user_id === uid).length,
          streak: streak?.current_streak ?? 0,
          points: streak?.points ?? 0,
          joinedAt: p.created_at,
        };
      });
      setUserStats(stats);
      setLoading(false);
    };
    loadAdmin();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array(8).fill(0).map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
        </div>
        <Card className="glass border-destructive/30">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <p className="text-xl font-semibold">Access Denied</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              You don't have admin privileges. Admin access is granted to the first registered user or accounts with "admin" in the email.
            </p>
            <Badge variant="destructive">Unauthorized</Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completionPct = systemStats.totalTopics > 0
    ? Math.round((systemStats.completedTopics / systemStats.totalTopics) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">System overview and user management</p>
        </div>
        <Badge className="ml-auto" variant="secondary"><Shield className="h-3 w-3 mr-1" />Admin</Badge>
      </div>

      {/* System Stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Users", value: systemStats.totalUsers, icon: Users, color: "text-blue-500", bg: "bg-blue-500" },
          { label: "Total Subjects", value: systemStats.totalSubjects, icon: BookOpen, color: "text-indigo-500", bg: "bg-indigo-500" },
          { label: "Total Topics", value: systemStats.totalTopics, icon: Target, color: "text-green-500", bg: "bg-green-500" },
          { label: "Completed Topics", value: systemStats.completedTopics, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500" },
          { label: "Pomodoro Sessions", value: systemStats.totalPomodoro, icon: Clock, color: "text-purple-500", bg: "bg-purple-500" },
          { label: "Study Minutes", value: systemStats.totalPomodoroMinutes, icon: TrendingUp, color: "text-violet-500", bg: "bg-violet-500" },
          { label: "Total Notes", value: systemStats.totalNotes, icon: Database, color: "text-cyan-500", bg: "bg-cyan-500" },
          { label: "Goals Created", value: systemStats.totalGoals, icon: Flame, color: "text-orange-500", bg: "bg-orange-500" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="glass">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}/10 flex-shrink-0`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground leading-tight">{s.label}</p>
                  <p className="text-xl font-display font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* System Health */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Topic Completion Rate</span>
                <span className="font-medium">{completionPct}%</span>
              </div>
              <Progress value={completionPct} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-muted-foreground text-xs">Avg Topics/User</p>
                <p className="font-bold">{systemStats.totalUsers > 0 ? (systemStats.totalTopics / systemStats.totalUsers).toFixed(1) : 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-muted-foreground text-xs">Avg Sessions/User</p>
                <p className="font-bold">{systemStats.totalUsers > 0 ? (systemStats.totalPomodoro / systemStats.totalUsers).toFixed(1) : 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-muted-foreground text-xs">Avg Minutes/User</p>
                <p className="font-bold">{systemStats.totalUsers > 0 ? (systemStats.totalPomodoroMinutes / systemStats.totalUsers).toFixed(0) : 0}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-muted-foreground text-xs">Notes/User</p>
                <p className="font-bold">{systemStats.totalUsers > 0 ? (systemStats.totalNotes / systemStats.totalUsers).toFixed(1) : 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Data Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Subjects", value: systemStats.totalSubjects, max: Math.max(systemStats.totalSubjects, 1), color: "bg-blue-500" },
              { label: "Topics", value: systemStats.totalTopics, max: Math.max(systemStats.totalTopics, 1), color: "bg-green-500" },
              { label: "Notes", value: systemStats.totalNotes, max: Math.max(systemStats.totalNotes, 1), color: "bg-cyan-500" },
              { label: "Pomodoros", value: systemStats.totalPomodoro, max: Math.max(systemStats.totalPomodoro, 1), color: "bg-purple-500" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{ width: `${Math.round((item.value / item.max) * 100)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* User Table */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Users ({userStats.length})
          </CardTitle>
          <CardDescription>Registered users and their activity summary</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userStats.map((u, i) => {
              const uPct = u.topics > 0 ? Math.round((u.completedTopics / u.topics) * 100) : 0;
              const initials = u.name ? u.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";
              return (
                <motion.div key={u.user_id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
                  <div className="flex items-center gap-4 p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="gradient-primary text-primary-foreground text-sm font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{u.name || "Unnamed User"}</p>
                        {i === 0 && <Badge variant="secondary" className="text-xs">Admin</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><BookOpen className="h-3 w-3" />{u.subjects} subj</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Target className="h-3 w-3" />{u.completedTopics}/{u.topics}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{u.pomodoroSessions} pomodoros</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" />{u.streak}d</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">{u.points} pts</Badge>
                      <div className="w-24">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                          <span>Progress</span><span>{uPct}%</span>
                        </div>
                        <Progress value={uPct} className="h-1.5" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {userStats.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No users found</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

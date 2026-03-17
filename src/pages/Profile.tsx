import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User, BookOpen, Target, Flame, TrendingUp, Clock,
  Trophy, Star, Calendar, Edit2, Mail, CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) {
  return (
    <Card className="glass">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}/10 flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-display font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    subjects: 0, topics: 0, completedTopics: 0,
    streak: 0, longestStreak: 0, points: 0,
    pomodoroSessions: 0, pomodoroMinutes: 0, notes: 0, goals: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [profRes, subRes, topRes, streakRes, pomRes, notesRes, goalsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("subjects").select("id, name, color").eq("user_id", user.id),
        supabase.from("topics").select("id, status").eq("user_id", user.id),
        supabase.from("user_streaks").select("*").eq("user_id", user.id).single(),
        supabase.from("pomodoro_sessions").select("duration, completed_at").eq("user_id", user.id).order("completed_at", { ascending: false }).limit(20),
        supabase.from("notes").select("id, title, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("goals").select("id").eq("user_id", user.id),
      ]);
      setProfile(profRes.data);
      const topics = topRes.data || [];
      const sessions = pomRes.data || [];
      setStats({
        subjects: subRes.data?.length ?? 0,
        topics: topics.length,
        completedTopics: topics.filter((t: any) => t.status === "completed").length,
        streak: streakRes.data?.current_streak ?? 0,
        longestStreak: streakRes.data?.longest_streak ?? 0,
        points: streakRes.data?.points ?? 0,
        pomodoroSessions: sessions.length,
        pomodoroMinutes: Math.round(sessions.reduce((a: number, s: any) => a + s.duration, 0) / 60),
        notes: notesRes.data?.length ?? 0,
        goals: goalsRes.data?.length ?? 0,
      });
      // Build recent activity
      const activity: any[] = [];
      sessions.slice(0, 5).forEach((s: any) => {
        activity.push({ type: "pomodoro", label: `${Math.round(s.duration / 60)}min Pomodoro`, date: s.completed_at, icon: Clock, color: "text-purple-500" });
      });
      (notesRes.data || []).slice(0, 3).forEach((n: any) => {
        activity.push({ type: "note", label: `Note: ${n.title}`, date: n.created_at, icon: Star, color: "text-cyan-500" });
      });
      activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activity.slice(0, 8));
      setLoading(false);
    };
    fetch();
  }, [user]);

  const completionPct = stats.topics > 0 ? Math.round((stats.completedTopics / stats.topics) * 100) : 0;
  const initials = profile?.name ? profile.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : user?.email?.[0]?.toUpperCase() ?? "U";

  const studyGoalLabels: Record<string, string> = { exam: "Exam Preparation", skill: "Skill Building", placement: "Placement Prep" };
  const preferredTimeLabels: Record<string, string> = { morning: "Morning", afternoon: "Afternoon", evening: "Evening", night: "Night" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-1">Your study identity and activity</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/settings"><Edit2 className="mr-2 h-4 w-4" />Edit Profile</Link>
        </Button>
      </div>

      {/* Profile Hero Card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative">
                <Avatar className="h-20 w-20 text-2xl border-2 border-primary/30">
                  <AvatarFallback className="gradient-primary text-primary-foreground text-2xl font-display font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-success rounded-full p-1">
                  <div className="h-3 w-3 rounded-full bg-success" />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-display font-bold">{profile?.name || "Anonymous Student"}</h2>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{user?.email}</span>
                </div>
                {profile?.course && (
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{profile.course}</span>
                  </div>
                )}
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  {profile?.study_goal && (
                    <Badge variant="secondary">{studyGoalLabels[profile.study_goal] || profile.study_goal}</Badge>
                  )}
                  {profile?.preferred_study_time && (
                    <Badge variant="outline">{preferredTimeLabels[profile.preferred_study_time]} Learner</Badge>
                  )}
                  {stats.streak >= 7 && <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">🔥 {stats.streak}-day streak</Badge>}
                  {stats.points >= 100 && <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">⭐ {stats.points} pts</Badge>}
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 bg-muted/30 rounded-xl p-4">
                <Flame className="h-6 w-6 text-orange-500" />
                <span className="text-3xl font-display font-bold">{stats.streak}</span>
                <span className="text-xs text-muted-foreground">day streak</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Subjects", value: stats.subjects, icon: BookOpen, color: "text-blue-500" },
          { label: "Topics Done", value: `${stats.completedTopics}/${stats.topics}`, icon: CheckCircle2, color: "text-green-500" },
          { label: "Best Streak", value: `${stats.longestStreak}d`, icon: Flame, color: "text-orange-500" },
          { label: "Total Points", value: stats.points, icon: Trophy, color: "text-yellow-500" },
          { label: "Pomodoros", value: stats.pomodoroSessions, icon: Clock, color: "text-purple-500" },
          { label: "Study Total", value: `${Math.round(stats.pomodoroMinutes / 60 * 10) / 10}h`, icon: TrendingUp, color: "text-indigo-500" },
          { label: "Notes", value: stats.notes, icon: Star, color: "text-cyan-500" },
          { label: "Goals Set", value: stats.goals, icon: Target, color: "text-pink-500" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <StatCard {...s} />
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Completion Progress */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2"><Target className="h-5 w-5 text-primary" />Curriculum Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Completion</span>
              <span className="font-bold">{completionPct}%</span>
            </div>
            <Progress value={completionPct} className="h-3" />
            <p className="text-xs text-muted-foreground">{stats.completedTopics} done · {stats.topics - stats.completedTopics} remaining</p>
            {profile?.daily_available_hours && (
              <div className="flex items-center gap-2 text-sm mt-2 p-2 rounded-lg bg-muted/30">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Daily goal: <strong>{profile.daily_available_hours}h</strong></span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <a.icon className={`h-4 w-4 ${a.color} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.label}</p>
                      <p className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

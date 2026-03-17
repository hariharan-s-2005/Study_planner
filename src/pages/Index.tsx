import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Clock, Flame, Target, TrendingUp, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export default function Index() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ subjects: 0, topics: 0, completedTopics: 0, streak: 0, points: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, subjectsRes, topicsRes, streakRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", user.id).single(),
        supabase.from("subjects").select("id").eq("user_id", user.id),
        supabase.from("topics").select("id, status").eq("user_id", user.id),
        supabase.from("user_streaks").select("*").eq("user_id", user.id).single(),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      const topics = topicsRes.data || [];
      setStats({
        subjects: subjectsRes.data?.length || 0,
        topics: topics.length,
        completedTopics: topics.filter((t) => t.status === "completed").length,
        streak: streakRes.data?.current_streak || 0,
        points: streakRes.data?.points || 0,
      });
    };
    fetchData();
  }, [user]);

  const completionPct = stats.topics > 0 ? Math.round((stats.completedTopics / stats.topics) * 100) : 0;
  const greeting = profile?.name ? `Welcome back, ${profile.name.split(" ")[0]}!` : "Welcome back!";

  return (
    <div className="space-y-6">
      <motion.div {...fadeIn} transition={{ delay: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">{greeting}</h1>
            <p className="text-muted-foreground mt-1">Here's your study overview for today</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/planner"><Brain className="mr-2 h-4 w-4" /> Generate Plan</Link>
            </Button>
            <Button asChild size="sm" className="gradient-primary text-primary-foreground">
              <Link to="/subjects"><BookOpen className="mr-2 h-4 w-4" /> Add Subject</Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Subjects", value: stats.subjects, icon: BookOpen, color: "text-primary" },
          { label: "Topics", value: `${stats.completedTopics}/${stats.topics}`, icon: Target, color: "text-accent" },
          { label: "Streak", value: `${stats.streak} days`, icon: Flame, color: "text-warning" },
          { label: "Points", value: stats.points, icon: TrendingUp, color: "text-success" },
        ].map((stat, i) => (
          <motion.div key={stat.label} {...fadeIn} transition={{ delay: 0.1 * (i + 1) }}>
            <Card className="glass">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-display font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Progress & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div {...fadeIn} transition={{ delay: 0.5 }}>
          <Card className="glass h-full">
            <CardHeader>
              <CardTitle className="font-display text-lg">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-5xl font-display font-bold text-gradient">{completionPct}%</p>
                <p className="text-sm text-muted-foreground mt-2">of all topics completed</p>
              </div>
              <Progress value={completionPct} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">
                {stats.completedTopics} completed • {stats.topics - stats.completedTopics} remaining
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.6 }}>
          <Card className="glass h-full">
            <CardHeader>
              <CardTitle className="font-display text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Generate AI Study Plan", to: "/planner", icon: Brain },
                { label: "Start Pomodoro Session", to: "/pomodoro", icon: Clock },
                { label: "View Calendar", to: "/calendar", icon: Calendar },
                { label: "Chat with AI Assistant", to: "/chat", icon: Brain },
              ].map((action) => (
                <Link key={action.to} to={action.to} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <action.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

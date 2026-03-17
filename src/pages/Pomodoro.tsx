import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Play, Pause, RefreshCw, CheckCircle2, Timer as TimerIcon } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const FOCUS_TIME = 25 * 60; // 25 minutes in seconds
const BREAK_TIME = 5 * 60;  // 5 minutes in seconds

export default function Pomodoro() {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("none");
  const [sessionsToday, setSessionsToday] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchTopics = async () => {
      const { data } = await supabase.from("topics").select("id, name, subjects(name, color)").eq("user_id", user.id).neq("status", "completed");
      setTopics(data || []);
    };
    const fetchSessions = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { count } = await supabase.from("pomodoro_sessions").select("id", { count: "exact" }).eq("user_id", user.id).gte("completed_at", `${today}T00:00:00`);
      setSessionsToday(count || 0);
    };
    fetchTopics();
    fetchSessions();
  }, [user]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, timeLeft]);

  const handleSessionComplete = async () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (!isBreak) {
      toast.success("Focus session complete! Time for a break.");
      if (user) {
        await supabase.from("pomodoro_sessions").insert({
          user_id: user.id,
          topic_id: selectedTopic === "none" ? null : selectedTopic,
          duration: Math.round(FOCUS_TIME / 60),
        });
        setSessionsToday((p) => p + 1);
        // Also update streak points if wanted, but preserving simplicity
      }
      setIsBreak(true);
      setTimeLeft(BREAK_TIME);
    } else {
      toast.success("Break over! Ready to focus?");
      setIsBreak(false);
      setTimeLeft(FOCUS_TIME);
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(FOCUS_TIME);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = isBreak ? (BREAK_TIME - timeLeft) / BREAK_TIME : (FOCUS_TIME - timeLeft) / FOCUS_TIME;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div>
        <h1 className="font-display text-3xl font-bold">Pomodoro</h1>
        <p className="text-muted-foreground mt-1">Focus with timed study sessions</p>
      </div>

      <Card className="glass flex flex-col items-center justify-center py-10">
        <div className="relative flex items-center justify-center w-64 h-64">
          <svg className="absolute w-full h-full transform -rotate-90">
            <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" className="text-muted/20" fill="transparent" />
            <motion.circle
              cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8"
              className={isBreak ? "text-success" : "text-primary"}
              fill="transparent"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progress)}
              transition={{ duration: 0.5, ease: "linear" }}
            />
          </svg>
          <div className="absolute text-center">
            <AnimatePresence mode="wait">
              <motion.span key={timeLeft} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-4xl font-display font-bold">
                {formatTime(timeLeft)}
              </motion.span>
            </AnimatePresence>
            <p className="text-xs text-muted-foreground mt-1">{isBreak ? "Break Time" : "Focus Time"}</p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <Button onClick={toggleTimer} size="lg" className={`w-32 ${isRunning ? "bg-secondary" : "gradient-primary text-primary-foreground"}`}>
            {isRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            {isRunning ? "Pause" : "Start"}
          </Button>
          <Button onClick={resetTimer} variant="outline" size="lg" className="w-12 p-0"><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </Card>

      {!isBreak && (
        <Card className="glass">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg">Focus Target</CardTitle>
            <CardDescription>Select a topic to work on</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="General Study" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General Study (No Topic)</SelectItem>
                  {topics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.subjects?.name || "No Subject"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card className="glass">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Sessions Today</CardDescription>
            <CardTitle className="font-display text-2xl font-bold">{sessionsToday}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs">Focus Time</CardDescription>
            <CardTitle className="font-display text-2xl font-bold">{sessionsToday * 25} min</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

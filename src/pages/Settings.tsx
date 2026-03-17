import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, AlertTriangle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    course: "",
    study_goal: "exam" as string,
    daily_available_hours: "4",
    preferred_study_time: "morning" as string,
    break_duration: "10",
  });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        setForm({
          name: data.name || "",
          course: data.course || "",
          study_goal: data.study_goal || "exam",
          daily_available_hours: String(data.daily_available_hours || 4),
          preferred_study_time: data.preferred_study_time || "morning",
          break_duration: String(data.break_duration || 10),
        });
      }
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      name: form.name,
      course: form.course,
      study_goal: form.study_goal as any,
      daily_available_hours: Number(form.daily_available_hours),
      preferred_study_time: form.preferred_study_time as any,
      break_duration: Number(form.break_duration),
    }).eq("user_id", user.id);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated!");
  };

  const handleResetData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await Promise.all([
        supabase.from("subjects").delete().eq("user_id", user.id),
        supabase.from("study_plans").delete().eq("user_id", user.id),
        supabase.from("notes").delete().eq("user_id", user.id),
        supabase.from("goals").delete().eq("user_id", user.id),
        supabase.from("pomodoro_sessions").delete().eq("user_id", user.id),
        supabase.from("chat_messages").delete().eq("user_id", user.id),
        supabase.from("user_streaks").update({ current_streak: 0, longest_streak: 0, points: 0, last_study_date: null }).eq("user_id", user.id)
      ]);
      toast.success("All data has been reset!");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Customize your study preferences</p>
      </div>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="font-display">Profile</CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Course / Program</Label>
              <Input value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="e.g. B.Tech CSE" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle className="font-display">Study Preferences</CardTitle>
          <CardDescription>Help the AI plan better for you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Study Goal</Label>
              <Select value={form.study_goal} onValueChange={(v) => setForm({ ...form, study_goal: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="exam">Exam Preparation</SelectItem>
                  <SelectItem value="skill">Skill Building</SelectItem>
                  <SelectItem value="placement">Placement Prep</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Preferred Study Time</Label>
              <Select value={form.preferred_study_time} onValueChange={(v) => setForm({ ...form, preferred_study_time: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Daily Available Hours</Label>
              <Input type="number" min="1" max="16" value={form.daily_available_hours} onChange={(e) => setForm({ ...form, daily_available_hours: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Break Duration (min)</Label>
              <Input type="number" min="5" max="30" value={form.break_duration} onChange={(e) => setForm({ ...form, break_duration: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-destructive/30">
        <CardHeader>
          <CardTitle className="font-display text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Danger Zone
          </CardTitle>
          <CardDescription>Permanently delete all your study data</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Reset All Data</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your subjects, topics, notes, and study history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetData} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Reset Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={loading} className="gradient-primary text-primary-foreground">
        <Save className="mr-2 h-4 w-4" /> {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}

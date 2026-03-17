import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save } from "lucide-react";

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

      <Button onClick={handleSave} disabled={loading} className="gradient-primary text-primary-foreground">
        <Save className="mr-2 h-4 w-4" /> {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}

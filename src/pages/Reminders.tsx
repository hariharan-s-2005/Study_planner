import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Plus, Trash2, BellOff, BellRing, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Reminder {
  id: string;
  title: string;
  time: string;
  days: string[];
  enabled: boolean;
  createdAt: number;
}

const DAY_OPTIONS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STORAGE_KEY = "studyai_reminders";

function loadReminders(): Reminder[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveReminders(r: Reminder[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); }

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>(loadReminders);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", time: "08:00", days: ["Mon","Tue","Wed","Thu","Fri"] as string[] });
  const [notifStatus, setNotifStatus] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) setNotifStatus(Notification.permission);
  }, []);

  const requestNotifPermission = async () => {
    if (!("Notification" in window)) return toast.error("Browser notifications not supported");
    const perm = await Notification.requestPermission();
    setNotifStatus(perm);
    if (perm === "granted") toast.success("Notifications enabled!");
    else toast.error("Notification permission denied");
  };

  const toggleDay = (day: string) => {
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day],
    }));
  };

  const handleAdd = () => {
    if (!form.title.trim()) return toast.error("Please enter a reminder title");
    if (form.days.length === 0) return toast.error("Please select at least one day");
    const newReminder: Reminder = {
      id: Date.now().toString(),
      title: form.title.trim(),
      time: form.time,
      days: form.days,
      enabled: true,
      createdAt: Date.now(),
    };
    const updated = [newReminder, ...reminders];
    setReminders(updated);
    saveReminders(updated);
    setOpen(false);
    setForm({ title: "", time: "08:00", days: ["Mon","Tue","Wed","Thu","Fri"] });
    toast.success("Reminder created!");
    if (notifStatus === "granted") {
      new Notification("📚 StudyAI Reminder Set", { body: `"${newReminder.title}" at ${newReminder.time}` });
    }
  };

  const toggleEnabled = (id: string) => {
    const updated = reminders.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r);
    setReminders(updated);
    saveReminders(updated);
  };

  const handleDelete = (id: string) => {
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    saveReminders(updated);
    toast.success("Reminder removed");
  };

  const testNotif = (r: Reminder) => {
    if (notifStatus !== "granted") return toast.error("Enable notifications first");
    new Notification(`📚 ${r.title}`, { body: `Reminder at ${r.time} — ${r.days.join(", ")}` });
    toast.success("Test notification sent!");
  };

  const active = reminders.filter((r) => r.enabled);
  const inactive = reminders.filter((r) => !r.enabled);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Reminders</h1>
          <p className="text-muted-foreground mt-1">Schedule study reminders with browser notifications</p>
        </div>
        <div className="flex gap-2">
          {notifStatus !== "granted" && (
            <Button variant="outline" onClick={requestNotifPermission}>
              <BellRing className="mr-2 h-4 w-4" />Enable Notifications
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" />New Reminder</Button>
            </DialogTrigger>
            <DialogContent className="glass">
              <DialogHeader>
                <DialogTitle className="font-display">Create Reminder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Reminder Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Morning study session" />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Repeat on Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAY_OPTIONS.map((d) => (
                      <button key={d} type="button"
                        onClick={() => toggleDay(d)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                          form.days.includes(d)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >{d}</button>
                    ))}
                  </div>
                </div>
                {notifStatus !== "granted" && (
                  <p className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded p-2">
                    ⚠️ Browser notifications are not enabled. Enable them to receive alerts.
                  </p>
                )}
                <Button className="w-full gradient-primary text-primary-foreground" onClick={handleAdd}>Create Reminder</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Notification status banner */}
      <Card className={`glass border-${notifStatus === "granted" ? "success" : "warning"}/30`}>
        <CardContent className="p-4 flex items-center gap-3">
          {notifStatus === "granted"
            ? <BellRing className="h-5 w-5 text-success" />
            : <BellOff className="h-5 w-5 text-amber-500" />}
          <div>
            <p className="text-sm font-medium">
              {notifStatus === "granted" ? "Browser notifications are enabled" : "Browser notifications are disabled"}
            </p>
            <p className="text-xs text-muted-foreground">
              {notifStatus === "granted"
                ? "You will receive reminder notifications in this browser"
                : "Click 'Enable Notifications' to receive study reminders"}
            </p>
          </div>
          <Badge variant="outline" className={`ml-auto ${notifStatus === "granted" ? "text-success border-success/30" : "text-amber-500 border-amber-500/30"}`}>
            {notifStatus === "granted" ? "Active" : notifStatus === "denied" ? "Denied" : "Pending"}
          </Badge>
        </CardContent>
      </Card>

      {reminders.length === 0 ? (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No reminders yet</p>
            <p className="text-sm text-muted-foreground">Create a reminder to schedule your study sessions</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {active.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2"><Bell className="h-5 w-5 text-primary" />Active ({active.length})</h2>
              <div className="space-y-3">
                {active.map((r, i) => (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                    <Card className="glass border-primary/20">
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{r.title}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">{r.time}</Badge>
                            <div className="flex gap-1">
                              {r.days.map((d) => (
                                <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{d}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => testNotif(r)}>Test</Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => toggleEnabled(r.id)}>
                            <BellOff className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {inactive.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-muted-foreground"><BellOff className="h-5 w-5" />Paused ({inactive.length})</h2>
              <div className="space-y-3">
                {inactive.map((r) => (
                  <Card key={r.id} className="glass opacity-60">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 flex-shrink-0">
                        <BellOff className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-muted-foreground">{r.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{r.time}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleEnabled(r.id)}>
                          <BellRing className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

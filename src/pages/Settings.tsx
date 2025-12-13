import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Heart, ArrowLeft, Bell, Shield, Palette, Globe, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    medicationReminders: true,
    darkMode: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast({
      title: "Setting updated",
      description: "Your preferences have been saved.",
    });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Heart className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">Settings</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Notifications */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Manage how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications" className="flex flex-col gap-1">
                <span>Email Notifications</span>
                <span className="text-sm text-muted-foreground font-normal">
                  Receive updates via email
                </span>
              </Label>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={() => handleToggle("emailNotifications")}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-notifications" className="flex flex-col gap-1">
                <span>SMS Notifications</span>
                <span className="text-sm text-muted-foreground font-normal">
                  Get text message alerts
                </span>
              </Label>
              <Switch
                id="sms-notifications"
                checked={settings.smsNotifications}
                onCheckedChange={() => handleToggle("smsNotifications")}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="appointment-reminders" className="flex flex-col gap-1">
                <span>Appointment Reminders</span>
                <span className="text-sm text-muted-foreground font-normal">
                  Reminders before scheduled visits
                </span>
              </Label>
              <Switch
                id="appointment-reminders"
                checked={settings.appointmentReminders}
                onCheckedChange={() => handleToggle("appointmentReminders")}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="medication-reminders" className="flex flex-col gap-1">
                <span>Medication Reminders</span>
                <span className="text-sm text-muted-foreground font-normal">
                  Daily medication alerts
                </span>
              </Label>
              <Switch
                id="medication-reminders"
                checked={settings.medicationReminders}
                onCheckedChange={() => handleToggle("medicationReminders")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="w-5 h-5 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>Customize your experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex flex-col gap-1">
                <span>Dark Mode</span>
                <span className="text-sm text-muted-foreground font-normal">
                  Use dark theme
                </span>
              </Label>
              <Switch
                id="dark-mode"
                checked={settings.darkMode}
                onCheckedChange={() => handleToggle("darkMode")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" />
              Privacy & Security
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/profile">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start">
              Two-Factor Authentication
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Download My Data
            </Button>
          </CardContent>
        </Card>

        {/* Language */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5 text-primary" />
              Language & Region
            </CardTitle>
            <CardDescription>Set your preferred language</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start">
              English (US)
            </Button>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card className="border-0 shadow-sm border-destructive/20">
          <CardContent className="pt-6">
            <Button 
              variant="destructive" 
              className="w-full gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
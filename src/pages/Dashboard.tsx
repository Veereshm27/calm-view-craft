import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  FileText,
  Pill,
  Activity,
  Bell,
  Settings,
  LogOut,
  Plus,
  Clock,
  User,
  Heart,
  ChevronRight,
  TrendingUp,
  Stethoscope,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface Appointment {
  id: string;
  doctor_name: string;
  doctor_specialty: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  status: string;
}

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  pills_remaining: number;
  refill_date: string | null;
  status: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchProfile(), fetchAppointments(), fetchPrescriptions()]);
    setLoading(false);
  };

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("user_id", user?.id)
      .maybeSingle();
    
    setProfile(data);
  };

  const fetchAppointments = async () => {
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", user?.id)
      .gte("appointment_date", new Date().toISOString().split("T")[0])
      .order("appointment_date", { ascending: true })
      .limit(5);
    
    setAppointments(data || []);
  };

  const fetchPrescriptions = async () => {
    const { data } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("user_id", user?.id)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    
    setPrescriptions(data || []);
  };

  const handleRequestRefill = async (prescription: Prescription) => {
    const { error } = await supabase
      .from("prescriptions")
      .update({ 
        status: "refill_requested",
        refill_date: new Date().toISOString().split("T")[0]
      })
      .eq("id", prescription.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to request refill. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Refill Requested",
        description: `Refill request for ${prescription.medication_name} has been submitted.`,
      });
      fetchPrescriptions();
    }
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const getDisplayName = () => {
    if (profile?.first_name) {
      return profile.first_name;
    }
    return user?.email?.split("@")[0] || "User";
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const vitals = [
    { label: "Blood Pressure", value: "120/80", unit: "mmHg", trend: "normal" },
    { label: "Heart Rate", value: "72", unit: "bpm", trend: "normal" },
    { label: "Weight", value: "68", unit: "kg", trend: "up" },
    { label: "BMI", value: "22.5", unit: "", trend: "normal" },
  ];

  const recentRecords = [
    { id: 1, name: "Blood Test Results", date: "Dec 10, 2024", status: "New" },
    { id: 2, name: "X-Ray Report", date: "Dec 5, 2024", status: "Reviewed" },
    { id: 3, name: "Prescription", date: "Dec 1, 2024", status: "Reviewed" },
  ];

  return (
    <div className="min-h-screen bg-secondary">
      {/* Dashboard Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">CareFlow</span>
            </Link>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>
              <Link to="/profile">
                <Avatar className="cursor-pointer">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground">{getInitials()}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back, {getDisplayName()}!</h1>
            <p className="text-muted-foreground">Here's an overview of your health status</p>
          </div>
          <Link to="/appointments/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Book Appointment
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {vitals.map((vital, index) => (
                <Card key={index} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{vital.label}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-foreground">{vital.value}</span>
                      <span className="text-xs text-muted-foreground">{vital.unit}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {vital.trend === "normal" ? (
                        <Activity className="w-3 h-3 text-green-500" />
                      ) : (
                        <TrendingUp className="w-3 h-3 text-orange-500" />
                      )}
                      <span className="text-xs text-muted-foreground capitalize">{vital.trend}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Upcoming Appointments */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
                  <CardDescription>Your scheduled visits</CardDescription>
                </div>
                <Link to="/appointments/new">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Book New
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No upcoming appointments</p>
                    <Link to="/appointments/new">
                      <Button variant="link" className="mt-2">Book your first appointment</Button>
                    </Link>
                  </div>
                ) : (
                  appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center gap-4 p-4 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Stethoscope className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{apt.doctor_name}</p>
                        <p className="text-sm text-muted-foreground">{apt.doctor_specialty}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {format(new Date(apt.appointment_date), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          {apt.appointment_time}
                        </p>
                      </div>
                      <Badge variant="secondary">{apt.appointment_type}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Recent Records */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">Recent Records</CardTitle>
                  <CardDescription>Your latest medical documents</CardDescription>
                </div>
                <Link to="/records">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center gap-4 p-3 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{record.name}</p>
                        <p className="text-xs text-muted-foreground">{record.date}</p>
                      </div>
                      <Badge
                        variant={record.status === "New" ? "default" : "secondary"}
                      >
                        {record.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="text-center">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{getInitials()}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-foreground">
                    {profile?.first_name && profile?.last_name 
                      ? `${profile.first_name} ${profile.last_name}`
                      : getDisplayName()}
                  </h3>
                  <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
                  <div className="flex gap-2 mt-4">
                    <Link to="/profile" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <User className="w-4 h-4" />
                        Profile
                      </Button>
                    </Link>
                    <Link to="/settings" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medications */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Medications</CardTitle>
                  <Pill className="w-5 h-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {prescriptions.length === 0 ? (
                  <div className="text-center py-4">
                    <Pill className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No active prescriptions</p>
                  </div>
                ) : (
                  prescriptions.map((med) => (
                    <div key={med.id} className="p-3 bg-secondary rounded-xl">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-foreground text-sm">{med.medication_name}</p>
                          <p className="text-xs text-muted-foreground">{med.dosage} • {med.frequency}</p>
                        </div>
                        <Badge variant={med.pills_remaining < 10 ? "destructive" : "secondary"}>
                          {med.pills_remaining} left
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
                <Button 
                  variant="outline" 
                  className="w-full gap-2" 
                  size="sm"
                  onClick={() => {
                    if (prescriptions.length > 0) {
                      handleRequestRefill(prescriptions[0]);
                    } else {
                      toast({
                        title: "No prescriptions",
                        description: "You don't have any active prescriptions to refill.",
                      });
                    }
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Request Refill
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/appointments/new">
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <Calendar className="w-4 h-4 text-primary" />
                    Schedule Appointment
                  </Button>
                </Link>
                <Link to="/records">
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <FileText className="w-4 h-4 text-primary" />
                    View Medical Records
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <Bell className="w-4 h-4 text-primary" />
                    Upcoming Events
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
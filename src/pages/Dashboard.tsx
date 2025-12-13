import { Link } from "react-router-dom";
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

const Dashboard = () => {
  const upcomingAppointments = [
    {
      id: 1,
      doctor: "Dr. Sarah Johnson",
      specialty: "General Physician",
      date: "Dec 15, 2024",
      time: "10:00 AM",
      type: "Checkup",
    },
    {
      id: 2,
      doctor: "Dr. Michael Chen",
      specialty: "Cardiologist",
      date: "Dec 18, 2024",
      time: "2:30 PM",
      type: "Follow-up",
    },
  ];

  const recentRecords = [
    { id: 1, name: "Blood Test Results", date: "Dec 10, 2024", status: "New" },
    { id: 2, name: "X-Ray Report", date: "Dec 5, 2024", status: "Reviewed" },
    { id: 3, name: "Prescription", date: "Dec 1, 2024", status: "Reviewed" },
  ];

  const vitals = [
    { label: "Blood Pressure", value: "120/80", unit: "mmHg", trend: "normal" },
    { label: "Heart Rate", value: "72", unit: "bpm", trend: "normal" },
    { label: "Weight", value: "68", unit: "kg", trend: "up" },
    { label: "BMI", value: "22.5", unit: "", trend: "normal" },
  ];

  const medications = [
    { name: "Vitamin D", dosage: "1000 IU", frequency: "Once daily", remaining: 15 },
    { name: "Omega-3", dosage: "1000 mg", frequency: "Twice daily", remaining: 8 },
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
                  <AvatarFallback className="bg-primary text-primary-foreground">JD</AvatarFallback>
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
            <h1 className="text-2xl font-bold text-foreground">Welcome back, John!</h1>
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
                <Link to="/appointments">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-4 p-4 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Stethoscope className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{apt.doctor}</p>
                      <p className="text-sm text-muted-foreground">{apt.specialty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">{apt.date}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {apt.time}
                      </p>
                    </div>
                    <Badge variant="secondary">{apt.type}</Badge>
                  </div>
                ))}
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
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">JD</AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-foreground">John Doe</h3>
                  <p className="text-sm text-muted-foreground">john.doe@email.com</p>
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
                {medications.map((med, index) => (
                  <div key={index} className="p-3 bg-secondary rounded-xl">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-foreground text-sm">{med.name}</p>
                        <p className="text-xs text-muted-foreground">{med.dosage} • {med.frequency}</p>
                      </div>
                      <Badge variant={med.remaining < 10 ? "destructive" : "secondary"}>
                        {med.remaining} left
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full gap-2" size="sm">
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
                <Link to="/messages">
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <Bell className="w-4 h-4 text-primary" />
                    Message Your Doctor
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive">
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

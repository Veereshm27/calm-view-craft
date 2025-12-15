import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppointmentCalendar from "@/components/appointments/AppointmentCalendar";
import { ArrowLeft, Heart, Plus, Video, Loader2 } from "lucide-react";

interface Appointment {
  id: string;
  doctor_name: string;
  doctor_specialty: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  status: string;
  is_telemedicine?: boolean;
}

const AppointmentCalendarView = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("user_id", user?.id)
      .order("appointment_date", { ascending: true });

    setAppointments(data || []);
    setLoading(false);
  };

  const upcomingTelemedicine = appointments.filter(
    (apt) =>
      apt.appointment_type === "Video Consultation" &&
      new Date(apt.appointment_date) >= new Date()
  );

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
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
              <Link to="/dashboard">
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/appointments/new">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Appointment
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Appointment Calendar</h1>
          <p className="text-muted-foreground">
            Drag and drop appointments to reschedule them
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            {loading ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : (
              <AppointmentCalendar
                appointments={appointments}
                onAppointmentUpdate={fetchAppointments}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Video Calls */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  Video Consultations
                </CardTitle>
                <CardDescription>Upcoming telemedicine appointments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingTelemedicine.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming video consultations
                  </p>
                ) : (
                  upcomingTelemedicine.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                      <p className="font-medium text-sm text-foreground">{apt.doctor_name}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {new Date(apt.appointment_date).toLocaleDateString()} at{" "}
                        {apt.appointment_time}
                      </p>
                      <Link to={`/telemedicine?appointment=${apt.id}`}>
                        <Button size="sm" variant="outline" className="w-full gap-2">
                          <Video className="w-3 h-3" />
                          Join Call
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Legend */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Legend</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary" />
                  <span className="text-sm text-muted-foreground">In-Person Visit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-chart-2" />
                  <span className="text-sm text-muted-foreground">Video Consultation</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCalendarView;

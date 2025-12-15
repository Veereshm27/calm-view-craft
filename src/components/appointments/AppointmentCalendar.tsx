import { useCallback, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";

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

interface AppointmentCalendarProps {
  appointments: Appointment[];
  onAppointmentUpdate: () => void;
}

const AppointmentCalendar = ({ appointments, onAppointmentUpdate }: AppointmentCalendarProps) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const events = appointments.map((apt) => {
    const [hours, minutes] = apt.appointment_time.split(":");
    const startDate = new Date(apt.appointment_date);
    startDate.setHours(parseInt(hours), parseInt(minutes.replace(/[AP]M/i, "")));
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 30);

    return {
      id: apt.id,
      title: `${apt.doctor_name} - ${apt.appointment_type}`,
      start: `${apt.appointment_date}T${convertTo24Hour(apt.appointment_time)}`,
      end: `${apt.appointment_date}T${addMinutes(convertTo24Hour(apt.appointment_time), 30)}`,
      backgroundColor: apt.is_telemedicine ? "hsl(var(--chart-2))" : "hsl(var(--primary))",
      borderColor: apt.is_telemedicine ? "hsl(var(--chart-2))" : "hsl(var(--primary))",
      extendedProps: {
        specialty: apt.doctor_specialty,
        type: apt.appointment_type,
        isTelemedicine: apt.is_telemedicine,
      },
    };
  });

  const convertTo24Hour = (time12h: string): string => {
    const [time, modifier] = time12h.split(" ");
    let [hours, minutes] = time.split(":");
    
    if (hours === "12") {
      hours = modifier?.toUpperCase() === "AM" ? "00" : "12";
    } else if (modifier?.toUpperCase() === "PM") {
      hours = String(parseInt(hours, 10) + 12);
    }
    
    return `${hours.padStart(2, "0")}:${minutes || "00"}`;
  };

  const addMinutes = (time: string, mins: number): string => {
    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + mins;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`;
  };

  const handleEventDrop = useCallback(
    async (info: any) => {
      if (isUpdating) return;
      
      setIsUpdating(true);
      const appointmentId = info.event.id;
      const newDate = format(info.event.start, "yyyy-MM-dd");
      const newTime = format(info.event.start, "h:mm a");

      const { error } = await supabase
        .from("appointments")
        .update({
          appointment_date: newDate,
          appointment_time: newTime,
        })
        .eq("id", appointmentId);

      if (error) {
        info.revert();
        toast({
          title: "Error",
          description: "Failed to reschedule appointment.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Appointment Rescheduled",
          description: `Moved to ${format(info.event.start, "MMM d, yyyy")} at ${newTime}`,
        });
        onAppointmentUpdate();
      }
      setIsUpdating(false);
    },
    [isUpdating, toast, onAppointmentUpdate]
  );

  return (
    <div className="bg-background rounded-xl p-4 shadow-sm border border-border">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        events={events}
        editable={true}
        droppable={true}
        eventDrop={handleEventDrop}
        eventResize={handleEventDrop}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        height="auto"
        eventContent={(eventInfo) => (
          <div className="p-1 text-xs overflow-hidden">
            <div className="font-medium truncate">{eventInfo.event.title}</div>
            {eventInfo.event.extendedProps.isTelemedicine && (
              <div className="text-[10px] opacity-80">📹 Video Call</div>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default AppointmentCalendar;

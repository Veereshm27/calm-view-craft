import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Heart, ArrowLeft, CalendarIcon, Clock, Stethoscope, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const NewAppointment = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  const [formData, setFormData] = useState({
    doctor: "",
    type: "",
    time: "",
    reason: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const doctors = [
    { id: "1", name: "Dr. Sarah Johnson", specialty: "General Physician" },
    { id: "2", name: "Dr. Michael Chen", specialty: "Cardiologist" },
    { id: "3", name: "Dr. Emily Williams", specialty: "Dermatologist" },
    { id: "4", name: "Dr. David Brown", specialty: "Orthopedist" },
  ];

  const timeSlots = [
    "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  ];

  const appointmentTypes = [
    { value: "checkup", label: "General Checkup" },
    { value: "followup", label: "Follow-up Visit" },
    { value: "consultation", label: "Consultation" },
    { value: "emergency", label: "Urgent Care" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Appointment booked!",
        description: "You'll receive a confirmation email shortly.",
      });
      navigate("/dashboard");
    }, 1000);
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
              <span className="font-bold text-foreground">Book Appointment</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              Schedule an Appointment
            </CardTitle>
            <CardDescription>
              Choose your preferred doctor, date, and time for your visit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Doctor Selection */}
              <div className="space-y-2">
                <Label>Select Doctor</Label>
                <Select
                  value={formData.doctor}
                  onValueChange={(value) => setFormData({ ...formData, doctor: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        <div className="flex items-center gap-2">
                          <span>{doctor.name}</span>
                          <span className="text-muted-foreground">• {doctor.specialty}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Appointment Type */}
              <div className="space-y-2">
                <Label>Appointment Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type of visit" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <Label>Preferred Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date < new Date() || date.getDay() === 0}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Selection */}
              <div className="space-y-2">
                <Label>Preferred Time</Label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlots.map((time) => (
                    <Button
                      key={time}
                      type="button"
                      variant={formData.time === time ? "default" : "outline"}
                      size="sm"
                      className="relative"
                      onClick={() => setFormData({ ...formData, time })}
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {time}
                      {formData.time === time && (
                        <Check className="w-3 h-3 absolute top-1 right-1" />
                      )}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Visit (Optional)</Label>
                <Textarea
                  id="reason"
                  name="reason"
                  placeholder="Briefly describe the reason for your appointment..."
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="min-h-24"
                />
              </div>

              {/* Summary */}
              {formData.doctor && date && formData.time && (
                <div className="p-4 bg-secondary rounded-xl">
                  <h4 className="font-medium text-foreground mb-2">Appointment Summary</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Doctor: {doctors.find(d => d.id === formData.doctor)?.name}</p>
                    <p>Date: {format(date, "PPPP")}</p>
                    <p>Time: {formData.time}</p>
                    {formData.type && (
                      <p>Type: {appointmentTypes.find(t => t.value === formData.type)?.label}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Link to="/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={isLoading || !formData.doctor || !date || !formData.time}
                >
                  {isLoading ? "Booking..." : "Confirm Appointment"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NewAppointment;

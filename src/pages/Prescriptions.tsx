import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Pill, Plus, Calendar, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  pills_remaining: number;
  refill_date: string | null;
  prescribed_by: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const Prescriptions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    medication_name: "",
    dosage: "",
    frequency: "Once daily",
    pills_remaining: 30,
    refill_date: "",
    prescribed_by: "",
    notes: "",
  });

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["prescriptions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Prescription[];
    },
    enabled: !!user,
  });

  const addPrescription = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("prescriptions").insert({
        user_id: user!.id,
        medication_name: data.medication_name,
        dosage: data.dosage,
        frequency: data.frequency,
        pills_remaining: data.pills_remaining,
        refill_date: data.refill_date || null,
        prescribed_by: data.prescribed_by || null,
        notes: data.notes || null,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      toast.success("Prescription added successfully!");
      setIsAddDialogOpen(false);
      setFormData({
        medication_name: "",
        dosage: "",
        frequency: "Once daily",
        pills_remaining: 30,
        refill_date: "",
        prescribed_by: "",
        notes: "",
      });
    },
    onError: () => {
      toast.error("Failed to add prescription");
    },
  });

  const requestRefill = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("prescriptions")
        .update({ status: "refill_requested" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      toast.success("Refill requested successfully!");
    },
    onError: () => {
      toast.error("Failed to request refill");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPrescription.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case "refill_requested":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Refill Requested</Badge>;
      case "discontinued":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Discontinued</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const activePrescriptions = prescriptions?.filter((p) => p.status === "active") || [];
  const otherPrescriptions = prescriptions?.filter((p) => p.status !== "active") || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Prescriptions</h1>
            <p className="text-muted-foreground mt-1">Manage your medications and refills</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Prescription
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle>Add New Prescription</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="medication_name">Medication Name</Label>
                  <Input
                    id="medication_name"
                    value={formData.medication_name}
                    onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                    required
                    className="bg-background border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dosage">Dosage</Label>
                    <Input
                      id="dosage"
                      value={formData.dosage}
                      onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                      placeholder="e.g., 10mg"
                      required
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                    >
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Once daily">Once daily</SelectItem>
                        <SelectItem value="Twice daily">Twice daily</SelectItem>
                        <SelectItem value="Three times daily">Three times daily</SelectItem>
                        <SelectItem value="As needed">As needed</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pills_remaining">Pills Remaining</Label>
                    <Input
                      id="pills_remaining"
                      type="number"
                      value={formData.pills_remaining}
                      onChange={(e) => setFormData({ ...formData, pills_remaining: parseInt(e.target.value) })}
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="refill_date">Refill Date</Label>
                    <Input
                      id="refill_date"
                      type="date"
                      value={formData.refill_date}
                      onChange={(e) => setFormData({ ...formData, refill_date: e.target.value })}
                      className="bg-background border-border"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prescribed_by">Prescribed By</Label>
                  <Input
                    id="prescribed_by"
                    value={formData.prescribed_by}
                    onChange={(e) => setFormData({ ...formData, prescribed_by: e.target.value })}
                    placeholder="Doctor's name"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any special instructions..."
                    className="bg-background border-border"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={addPrescription.isPending}>
                  {addPrescription.isPending ? "Adding..." : "Add Prescription"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card border-border animate-pulse">
                <CardHeader className="h-24 bg-muted/20" />
                <CardContent className="h-32" />
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Active Prescriptions */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary" />
                Active Medications ({activePrescriptions.length})
              </h2>
              {activePrescriptions.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Pill className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No active prescriptions</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setIsAddDialogOpen(true)}
                    >
                      Add your first prescription
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activePrescriptions.map((prescription) => (
                    <Card key={prescription.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{prescription.medication_name}</CardTitle>
                          {getStatusBadge(prescription.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{prescription.dosage}</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{prescription.frequency}</span>
                        </div>
                        {prescription.refill_date && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span>Refill: {format(new Date(prescription.refill_date), "MMM d, yyyy")}</span>
                          </div>
                        )}
                        {prescription.pills_remaining <= 10 && (
                          <div className="flex items-center gap-2 text-sm text-yellow-400">
                            <AlertCircle className="w-4 h-4" />
                            <span>{prescription.pills_remaining} pills remaining</span>
                          </div>
                        )}
                        {prescription.prescribed_by && (
                          <p className="text-xs text-muted-foreground">
                            Prescribed by: {prescription.prescribed_by}
                          </p>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => requestRefill.mutate(prescription.id)}
                          disabled={requestRefill.isPending}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Request Refill
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Other Prescriptions */}
            {otherPrescriptions.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Other Prescriptions ({otherPrescriptions.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {otherPrescriptions.map((prescription) => (
                    <Card key={prescription.id} className="bg-card/50 border-border">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg text-muted-foreground">
                            {prescription.medication_name}
                          </CardTitle>
                          {getStatusBadge(prescription.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{prescription.dosage}</p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{prescription.frequency}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Prescriptions;

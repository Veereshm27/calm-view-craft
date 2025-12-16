import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Heart,
  ArrowLeft,
  Plus,
  Activity,
  Scale,
  Thermometer,
  Droplets,
  TrendingUp,
  Loader2,
  Download,
  FileText,
  FileSpreadsheet,
} from "lucide-react";

interface HealthMetric {
  id: string;
  metric_type: string;
  value: number;
  secondary_value: number | null;
  unit: string;
  notes: string | null;
  recorded_at: string;
}

const metricTypes = [
  { value: "blood_pressure", label: "Blood Pressure", unit: "mmHg", icon: Activity, hasSecondary: true },
  { value: "heart_rate", label: "Heart Rate", unit: "bpm", icon: Heart, hasSecondary: false },
  { value: "weight", label: "Weight", unit: "kg", icon: Scale, hasSecondary: false },
  { value: "blood_sugar", label: "Blood Sugar", unit: "mg/dL", icon: Droplets, hasSecondary: false },
  { value: "temperature", label: "Temperature", unit: "°F", icon: Thermometer, hasSecondary: false },
];

const HealthMetrics = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("blood_pressure");

  const [formData, setFormData] = useState({
    metric_type: "blood_pressure",
    value: "",
    secondary_value: "",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      fetchMetrics();
    }
  }, [user]);

  const fetchMetrics = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("health_metrics")
      .select("*")
      .eq("user_id", user?.id)
      .gte("recorded_at", subDays(new Date(), 30).toISOString())
      .order("recorded_at", { ascending: true });

    if (error) {
      console.error("Error fetching metrics:", error);
    } else {
      setMetrics(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    const selectedType = metricTypes.find((t) => t.value === formData.metric_type);

    const { error } = await supabase.from("health_metrics").insert({
      user_id: user.id,
      metric_type: formData.metric_type,
      value: parseFloat(formData.value),
      secondary_value: formData.secondary_value ? parseFloat(formData.secondary_value) : null,
      unit: selectedType?.unit || "",
      notes: formData.notes || null,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save metric. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Health metric recorded successfully.",
      });
      setFormData({ metric_type: "blood_pressure", value: "", secondary_value: "", notes: "" });
      setDialogOpen(false);
      fetchMetrics();
    }
    setSubmitting(false);
  };

  const exportToCSV = () => {
    if (metrics.length === 0) {
      toast({ title: "No data", description: "No metrics to export.", variant: "destructive" });
      return;
    }

    const headers = ["Date", "Type", "Value", "Secondary Value", "Unit", "Notes"];
    const rows = metrics.map((m) => [
      format(new Date(m.recorded_at), "yyyy-MM-dd HH:mm"),
      metricTypes.find((t) => t.value === m.metric_type)?.label || m.metric_type,
      m.value,
      m.secondary_value || "",
      m.unit,
      m.notes || "",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `health-metrics-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Success", description: "Health metrics exported as CSV." });
  };

  const exportToPDF = () => {
    if (metrics.length === 0) {
      toast({ title: "No data", description: "No metrics to export.", variant: "destructive" });
      return;
    }

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text("Health Metrics Report", 14, 22);
    
    // Date range
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), "MMMM d, yyyy")}`, 14, 30);
    doc.text(`Period: Last 30 days`, 14, 36);

    // Summary section
    doc.setFontSize(14);
    doc.text("Summary", 14, 48);
    
    let yPos = 56;
    metricTypes.forEach((type) => {
      const typeMetrics = metrics.filter((m) => m.metric_type === type.value);
      if (typeMetrics.length > 0) {
        const latest = typeMetrics[typeMetrics.length - 1];
        const avg = typeMetrics.reduce((sum, m) => sum + m.value, 0) / typeMetrics.length;
        doc.setFontSize(10);
        doc.text(
          `${type.label}: Latest ${latest.value}${latest.secondary_value ? `/${latest.secondary_value}` : ""} ${type.unit} | Avg: ${avg.toFixed(1)} ${type.unit}`,
          14,
          yPos
        );
        yPos += 7;
      }
    });

    // Table
    const tableData = metrics.map((m) => [
      format(new Date(m.recorded_at), "MMM d, yyyy HH:mm"),
      metricTypes.find((t) => t.value === m.metric_type)?.label || m.metric_type,
      m.secondary_value ? `${m.value}/${m.secondary_value}` : m.value.toString(),
      m.unit,
      m.notes || "-",
    ]);

    autoTable(doc, {
      startY: yPos + 10,
      head: [["Date", "Type", "Value", "Unit", "Notes"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`health-metrics-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast({ title: "Success", description: "Health metrics exported as PDF." });
  };

  const getChartData = (type: string) => {
    return metrics
      .filter((m) => m.metric_type === type)
      .map((m) => ({
        date: format(new Date(m.recorded_at), "MMM d"),
        value: m.value,
        secondary: m.secondary_value,
      }));
  };

  const getLatestMetric = (type: string) => {
    const typeMetrics = metrics.filter((m) => m.metric_type === type);
    return typeMetrics[typeMetrics.length - 1];
  };

  const selectedMetricType = metricTypes.find((t) => t.value === formData.metric_type);

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
            <div className="flex items-center gap-2">
              <Link to="/dashboard">
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
                    <FileText className="w-4 h-4" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
                    <FileSpreadsheet className="w-4 h-4" />
                    Export as CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Log Metric
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Log Health Metric</DialogTitle>
                    <DialogDescription>Record your latest health measurement</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Metric Type</Label>
                      <Select
                        value={formData.metric_type}
                        onValueChange={(value) => setFormData({ ...formData, metric_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {metricTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>
                          {selectedMetricType?.hasSecondary ? "Systolic" : "Value"} ({selectedMetricType?.unit})
                        </Label>
                        <Input
                          type="number"
                          value={formData.value}
                          onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                          placeholder={selectedMetricType?.hasSecondary ? "120" : "Enter value"}
                          required
                        />
                      </div>
                      {selectedMetricType?.hasSecondary && (
                        <div className="space-y-2">
                          <Label>Diastolic ({selectedMetricType?.unit})</Label>
                          <Input
                            type="number"
                            value={formData.secondary_value}
                            onChange={(e) => setFormData({ ...formData, secondary_value: e.target.value })}
                            placeholder="80"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Notes (optional)</Label>
                      <Textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any additional notes..."
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Metric"
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Health Metrics</h1>
          <p className="text-muted-foreground">Track and monitor your vitals over time</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {metricTypes.map((type) => {
            const latest = getLatestMetric(type.value);
            const Icon = type.icon;
            return (
              <Card key={type.value} className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab(type.value)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">{type.label}</span>
                  </div>
                  {latest ? (
                    <div>
                      <span className="text-xl font-bold text-foreground">
                        {latest.value}
                        {latest.secondary_value && `/${latest.secondary_value}`}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">{type.unit}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No data</span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Trends (Last 30 Days)
            </CardTitle>
            <CardDescription>View your health metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  {metricTypes.map((type) => (
                    <TabsTrigger key={type.value} value={type.value}>
                      {type.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {metricTypes.map((type) => {
                  const data = getChartData(type.value);
                  return (
                    <TabsContent key={type.value} value={type.value}>
                      {data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                          <type.icon className="w-12 h-12 mb-2 opacity-50" />
                          <p>No {type.label.toLowerCase()} data recorded yet</p>
                          <Button variant="link" onClick={() => setDialogOpen(true)}>
                            Log your first reading
                          </Button>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "hsl(var(--background))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "8px",
                              }}
                            />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="value"
                              name={type.hasSecondary ? "Systolic" : type.label}
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              dot={{ fill: "hsl(var(--primary))" }}
                            />
                            {type.hasSecondary && (
                              <Line
                                type="monotone"
                                dataKey="secondary"
                                name="Diastolic"
                                stroke="hsl(var(--chart-2))"
                                strokeWidth={2}
                                dot={{ fill: "hsl(var(--chart-2))" }}
                              />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Recent Entries */}
        <Card className="border-0 shadow-sm mt-6">
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
            <CardDescription>Your latest health recordings</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No metrics recorded yet</p>
            ) : (
              <div className="space-y-3">
                {metrics.slice(-10).reverse().map((metric) => {
                  const type = metricTypes.find((t) => t.value === metric.metric_type);
                  const Icon = type?.icon || Activity;
                  return (
                    <div key={metric.id} className="flex items-center gap-4 p-3 bg-secondary rounded-lg">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{type?.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(metric.recorded_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {metric.value}
                          {metric.secondary_value && `/${metric.secondary_value}`}
                        </p>
                        <p className="text-xs text-muted-foreground">{metric.unit}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HealthMetrics;

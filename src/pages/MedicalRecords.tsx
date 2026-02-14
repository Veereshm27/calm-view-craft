import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Heart,
  ArrowLeft,
  Upload,
  FileText,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Calendar,
  File,
  Image,
  FileSpreadsheet,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface MedicalRecord {
  id: string;
  name: string;
  record_type: string;
  description: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  status: string | null;
  uploaded_at: string;
  reviewed_at: string | null;
}

const MedicalRecords = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    recordType: "",
    description: "",
    file: null as File | null,
  });

  const recordTypes = [
    { value: "lab_result", label: "Lab Result", icon: FileSpreadsheet },
    { value: "prescription", label: "Prescription", icon: FileText },
    { value: "imaging", label: "Imaging/X-Ray", icon: Image },
    { value: "report", label: "Medical Report", icon: FileText },
    { value: "vaccination", label: "Vaccination Record", icon: File },
    { value: "other", label: "Other", icon: File },
  ];

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from("medical_records")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error("Error fetching records:", error);
      toast({
        title: "Error",
        description: "Failed to load medical records.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      setUploadForm({ ...uploadForm, file });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !uploadForm.file || !uploadForm.name || !uploadForm.recordType) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = uploadForm.file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("medical-documents")
        .upload(filePath, uploadForm.file);

      if (uploadError) throw uploadError;

      // Create record in database (store the file path, not a public URL)
      const { error: dbError } = await supabase.from("medical_records").insert({
        user_id: user.id,
        name: uploadForm.name,
        record_type: uploadForm.recordType,
        description: uploadForm.description || null,
        file_url: filePath,
        file_name: uploadForm.file.name,
        file_size: uploadForm.file.size,
        status: "New",
      });

      if (dbError) throw dbError;

      toast({
        title: "Upload successful",
        description: "Your medical record has been uploaded.",
      });

      setUploadForm({ name: "", recordType: "", description: "", file: null });
      setIsUploadOpen(false);
      fetchRecords();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your record.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (record: MedicalRecord) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      // Delete from storage if file exists
      if (record.file_url && user) {
        await supabase.storage.from("medical-documents").remove([record.file_url]);
      }

      // Delete from database
      const { error } = await supabase
        .from("medical_records")
        .delete()
        .eq("id", record.id);

      if (error) throw error;

      toast({
        title: "Record deleted",
        description: "The medical record has been deleted.",
      });

      fetchRecords();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting the record.",
        variant: "destructive",
      });
    }
  };

  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || record.record_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getRecordIcon = (type: string) => {
    const recordType = recordTypes.find((r) => r.value === type);
    return recordType?.icon || FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Heart className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">Medical Records</span>
              </div>
            </div>

            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Record
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Medical Record</DialogTitle>
                  <DialogDescription>
                    Add a new document to your medical records.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Document Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Blood Test Results - Dec 2024"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recordType">Record Type *</Label>
                    <Select
                      value={uploadForm.recordType}
                      onValueChange={(value) => setUploadForm({ ...uploadForm, recordType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {recordTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Optional notes about this document"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">File *</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileChange}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported: PDF, JPG, PNG, DOC, DOCX (max 10MB)
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsUploadOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="flex-1" disabled={uploading}>
                      {uploading ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {recordTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Records List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredRecords.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery || filterType !== "all"
                  ? "No records found"
                  : "No medical records yet"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || filterType !== "all"
                  ? "Try adjusting your search or filters"
                  : "Upload your first medical document to get started"}
              </p>
              {!searchQuery && filterType === "all" && (
                <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Your First Record
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRecords.map((record) => {
              const RecordIcon = getRecordIcon(record.record_type);
              return (
                <Card key={record.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <RecordIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground truncate">{record.name}</h3>
                          <Badge variant={record.status === "New" ? "default" : "secondary"}>
                            {record.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="capitalize">
                            {recordTypes.find((t) => t.value === record.record_type)?.label || record.record_type}
                          </span>
                          {record.file_size && (
                            <span>• {formatFileSize(record.file_size)}</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(record.uploaded_at), "MMM d, yyyy")}
                          </span>
                        </div>
                        {record.description && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {record.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {record.file_url && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="View"
                              onClick={async () => {
                                const { data } = await supabase.storage
                                  .from("medical-documents")
                                  .createSignedUrl(record.file_url!, 3600);
                                if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Download"
                              onClick={async () => {
                                const { data } = await supabase.storage
                                  .from("medical-documents")
                                  .createSignedUrl(record.file_url!, 3600, { download: record.file_name || true });
                                if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(record)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        {records.length > 0 && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{records.length}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {records.filter((r) => r.status === "New").length}
                </p>
                <p className="text-sm text-muted-foreground">New Records</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {records.filter((r) => r.record_type === "lab_result").length}
                </p>
                <p className="text-sm text-muted-foreground">Lab Results</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {records.filter((r) => r.record_type === "prescription").length}
                </p>
                <p className="text-sm text-muted-foreground">Prescriptions</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalRecords;

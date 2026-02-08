import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  Building2, Plus, Edit, Trash2, Link2, RefreshCw, CheckCircle,
  XCircle, Copy, ExternalLink, Wifi, Users, Monitor
} from "lucide-react";

interface ExamCenter {
  id: number;
  centerCode: string;
  centerName: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  adminUsername: string;
  adminEmail?: string;
  adminMobile?: string;
  totalSeats?: number;
  totalComputers?: number;
  lanServerIp?: string;
  lanServerPort?: number;
  syncToken: string;
  lastSyncAt?: string;
  isActive: boolean;
  syncedCount?: number;
  unsyncedCount?: number;
}

export default function ManageExamCenters() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<ExamCenter | null>(null);
  const [formData, setFormData] = useState({
    centerCode: "",
    centerName: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    adminUsername: "",
    adminPassword: "",
    adminEmail: "",
    adminMobile: "",
    totalSeats: 30,
    totalComputers: 30,
    lanServerIp: "",
    lanServerPort: 3000,
  });

  const { data: centers = [], isLoading } = useQuery<ExamCenter[]>({
    queryKey: ["/api/admin/center-sync-status"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/exam-centers", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Center Created", description: "Exam center created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/center-sync-status"] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      const res = await apiRequest("PATCH", `/api/exam-centers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Center Updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/center-sync-status"] });
      setDialogOpen(false);
      setEditingCenter(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/exam-centers/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Center Deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/center-sync-status"] });
    },
  });

  const generateLinkMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/exam-centers/${id}/generate-link`);
      return res.json();
    },
    onSuccess: (data) => {
      const baseUrl = window.location.origin;
      navigator.clipboard.writeText(`${baseUrl}${data.centerAdminLink}`);
      toast({
        title: "Link Generated & Copied",
        description: `Center Admin URL: ${baseUrl}${data.centerAdminLink}`,
      });
    },
  });

  const resetForm = () => {
    setFormData({
      centerCode: "",
      centerName: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      adminUsername: "",
      adminPassword: "",
      adminEmail: "",
      adminMobile: "",
      totalSeats: 30,
      totalComputers: 30,
      lanServerIp: "",
      lanServerPort: 3000,
    });
  };

  const handleEdit = (center: ExamCenter) => {
    setEditingCenter(center);
    setFormData({
      centerCode: center.centerCode,
      centerName: center.centerName,
      address: center.address || "",
      city: center.city || "",
      state: center.state || "",
      pincode: center.pincode || "",
      adminUsername: center.adminUsername,
      adminPassword: "",
      adminEmail: center.adminEmail || "",
      adminMobile: center.adminMobile || "",
      totalSeats: center.totalSeats || 30,
      totalComputers: center.totalComputers || 30,
      lanServerIp: center.lanServerIp || "",
      lanServerPort: center.lanServerPort || 3000,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCenter) {
      const updates = { ...formData };
      if (!updates.adminPassword) {
        delete (updates as any).adminPassword;
      }
      updateMutation.mutate({ id: editingCenter.id, data: updates });
    } else {
      createMutation.mutate(formData);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                ← Back to Admin
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Exam Center Management</h1>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Exam Centers</h1>
            <p className="text-muted-foreground">
              Manage exam centers, generate admin panel links, and monitor sync status
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingCenter(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-center">
                <Plus className="w-4 h-4 mr-2" />
                Add Center
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCenter ? "Edit Center" : "Add New Center"}</DialogTitle>
                <DialogDescription>
                  {editingCenter ? "Update center details" : "Create a new exam center with admin credentials"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Center Code</Label>
                    <Input
                      placeholder="e.g., DEL001"
                      value={formData.centerCode}
                      onChange={(e) => setFormData({ ...formData, centerCode: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Center Name</Label>
                    <Input
                      placeholder="Delhi Center 1"
                      value={formData.centerName}
                      onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    placeholder="Full address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      placeholder="State"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pincode</Label>
                    <Input
                      placeholder="110001"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Center Admin Credentials</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Admin Username</Label>
                      <Input
                        placeholder="admin_del001"
                        value={formData.adminUsername}
                        onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Admin Password {editingCenter && "(leave blank to keep current)"}</Label>
                      <Input
                        type="password"
                        placeholder="Strong password"
                        value={formData.adminPassword}
                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                        required={!editingCenter}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label>Admin Email</Label>
                      <Input
                        type="email"
                        placeholder="admin@center.com"
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Admin Mobile</Label>
                      <Input
                        placeholder="+91 9876543210"
                        value={formData.adminMobile}
                        onChange={(e) => setFormData({ ...formData, adminMobile: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Center Capacity & LAN Config</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Total Seats</Label>
                      <Input
                        type="number"
                        value={formData.totalSeats}
                        onChange={(e) => setFormData({ ...formData, totalSeats: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Computers</Label>
                      <Input
                        type="number"
                        value={formData.totalComputers}
                        onChange={(e) => setFormData({ ...formData, totalComputers: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>LAN Server IP</Label>
                      <Input
                        placeholder="192.168.1.1"
                        value={formData.lanServerIp}
                        onChange={(e) => setFormData({ ...formData, lanServerIp: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>LAN Port</Label>
                      <Input
                        type="number"
                        value={formData.lanServerPort}
                        onChange={(e) => setFormData({ ...formData, lanServerPort: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingCenter ? "Update Center" : "Create Center"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Centers</p>
                  <p className="text-2xl font-bold">{centers.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Centers</p>
                  <p className="text-2xl font-bold">{centers.filter((c: ExamCenter) => c.isActive).length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Sync</p>
                  <p className="text-2xl font-bold">
                    {centers.reduce((sum: number, c: ExamCenter) => sum + (c.unsyncedCount || 0), 0)}
                  </p>
                </div>
                <RefreshCw className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Exam Centers</CardTitle>
            <CardDescription>All registered exam centers with sync status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : centers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No exam centers created yet. Click "Add Center" to create one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Center</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Sync Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {centers.map((center: ExamCenter) => (
                    <TableRow key={center.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{center.centerName}</p>
                          <p className="text-sm text-muted-foreground font-mono">{center.centerCode}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{center.city || "-"}</p>
                          <p className="text-muted-foreground">{center.state}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {center.totalSeats || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Monitor className="w-3 h-3" />
                            {center.totalComputers || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-mono">{center.adminUsername}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-600">
                            {center.syncedCount || 0} synced
                          </Badge>
                          {(center.unsyncedCount || 0) > 0 && (
                            <Badge variant="destructive">
                              {center.unsyncedCount} pending
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {center.isActive ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => generateLinkMutation.mutate(center.id)}
                            title="Generate & Copy Admin Link"
                            data-testid={`button-copy-link-${center.id}`}
                          >
                            <Link2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(center)}
                            data-testid={`button-edit-${center.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this center?")) {
                                deleteMutation.mutate(center.id);
                              }
                            }}
                            data-testid={`button-delete-${center.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>Understanding the offline exam system architecture</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-muted rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="font-medium mb-2">1. Main Admin</h4>
                <p className="text-sm text-muted-foreground">
                  Creates exam centers, uploads candidates, assigns exams, and monitors all sync activities. 
                  Has complete control over the system.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <Wifi className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="font-medium mb-2">2. Center Admin</h4>
                <p className="text-sm text-muted-foreground">
                  Logs in via generated link, connected to internet. Manages student logins, 
                  starts exams, and syncs responses to main server.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                  <Monitor className="w-5 h-5 text-orange-600" />
                </div>
                <h4 className="font-medium mb-2">3. Student Panel</h4>
                <p className="text-sm text-muted-foreground">
                  NO internet connection. Connected to Center Admin via LAN cable. 
                  Takes exam offline, responses sync through Center Admin.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </main>
    </div>
  );
}

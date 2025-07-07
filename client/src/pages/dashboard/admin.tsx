import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AddUserModal } from "@/components/add-user-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Users,
  UserCheck,
  Calendar,
  Plus,
  Edit,
  Trash2,
  ClipboardList,
} from "lucide-react";

import { DashboardHeader } from "@/components/dashboard-header"; // ✅ ADDED

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  isActive: boolean;
}

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState("users");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: ["/api/attendance-all"],
    enabled: currentView === "attendance",
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const handleDeleteUser = (userId: string, userName: string) => {
    if (window.confirm(`Are you sure you want to delete ${userName}?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "head":
        return "bg-blue-100 text-blue-800";
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "teacher":
        return "bg-green-100 text-green-800";
      case "staff":
        return "bg-orange-100 text-orange-800";
      case "mazer":
        return "bg-yellow-100 text-yellow-800";
      case "assistant":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredUsers =
    users?.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* ✅ Loading with header */}
        <DashboardHeader
          role="admin"
          title="Admin Dashboard"
          subtitle="Manage users and system administration."
        />
        <main className="p-6">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ ADDED HEADER */}
      <DashboardHeader
        role="admin"
        title="Admin Dashboard"
        subtitle="Manage users and system administration."
      />

      <main className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-blue-600">{users?.length || 0}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="text-blue-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-green-600">
                    {users?.filter((u) => u.isActive).length || 0}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <UserCheck className="text-green-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Attendance Records</p>
                  <p className="text-2xl font-bold text-purple-600">5</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Calendar className="text-purple-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card
            className={`bg-white cursor-pointer hover:shadow-md transition-shadow ${
              currentView === "users" ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => setCurrentView("users")}
          >
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <h3 className="font-medium text-gray-800">User Management</h3>
            </CardContent>
          </Card>

          <Card
            className={`bg-white cursor-pointer hover:shadow-md transition-shadow ${
              currentView === "attendance" ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => setCurrentView("attendance")}
          >
            <CardContent className="p-6 text-center">
              <ClipboardList className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <h3 className="font-medium text-gray-800">Attendance Logs</h3>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        {currentView === "users" && (
          <Card className="bg-white">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>System Users</CardTitle>
                <Button
                  onClick={() => setAddUserModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-700">User ID</th>
                      <th className="text-left p-4 font-medium text-gray-700">Name</th>
                      <th className="text-left p-4 font-medium text-gray-700">Role</th>
                      <th className="text-left p-4 font-medium text-gray-700">Department</th>
                      <th className="text-left p-4 font-medium text-gray-700">Status</th>
                      <th className="text-left p-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium text-gray-800">{user.id}</td>
                        <td className="p-4 text-gray-800">{user.name}</td>
                        <td className="p-4">
                          <Badge className={`${getRoleBadgeColor(user.role)} capitalize`}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-4 text-gray-700">
                          {user.department || "Administration"}
                        </td>
                        <td className="p-4">
                          <Badge
                            className={
                              user.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {user.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              disabled={deleteUserMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No users found</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {currentView === "attendance" && (
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Attendance Logs</CardTitle>
              <p className="text-sm text-gray-600">
                View all staff and teacher attendance records
              </p>
            </CardHeader>

            <CardContent className="p-0">
              {attendanceLoading ? (
                <div className="text-center py-8 text-gray-500">Loading attendance data...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-700">Date</th>
                        <th className="text-left p-4 font-medium text-gray-700">User ID</th>
                        <th className="text-left p-4 font-medium text-gray-700">Name</th>
                        <th className="text-left p-4 font-medium text-gray-700">Role</th>
                        <th className="text-left p-4 font-medium text-gray-700">Status</th>
                        <th className="text-left p-4 font-medium text-gray-700">Time In</th>
                        <th className="text-left p-4 font-medium text-gray-700">Time Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData && attendanceData.length > 0 ? (
                        attendanceData.map((record: any) => (
                          <tr key={record.id} className="border-b hover:bg-gray-50">
                            <td className="p-4 text-gray-800">
                              {new Date(record.date).toLocaleDateString()}
                            </td>
                            <td className="p-4 font-medium text-gray-800">{record.userId}</td>
                            <td className="p-4 text-gray-800">
                              {record.user?.name || "Unknown"}
                            </td>
                            <td className="p-4">
                              <Badge
                                className={`${getRoleBadgeColor(
                                  record.user?.role || "staff"
                                )} capitalize`}
                              >
                                {record.user?.role || "N/A"}
                              </Badge>
                            </td>
                            <td className="p-4">
                              <Badge
                                className={
                                  record.status === "present"
                                    ? "bg-green-100 text-green-800"
                                    : record.status === "late"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }
                              >
                                {record.status}
                              </Badge>
                            </td>
                            <td className="p-4 text-gray-700">{record.timeIn || "N/A"}</td>
                            <td className="p-4 text-gray-700">{record.timeOut || "N/A"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-500">
                            No attendance records found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      <AddUserModal open={addUserModalOpen} onOpenChange={setAddUserModalOpen} />
    </div>
  );
}

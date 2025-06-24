import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AddUserModal } from "@/components/add-user-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, UserCheck, Calendar, Plus, Edit, Trash2, Search, Settings, ClipboardList } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  isActive: boolean;
}

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
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
      case "head": return "bg-blue-100 text-blue-800";
      case "admin": return "bg-purple-100 text-purple-800";
      case "teacher": return "bg-green-100 text-green-800";
      case "staff": return "bg-orange-100 text-orange-800";
      case "mazer": return "bg-yellow-100 text-yellow-800";
      case "assistant": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader role="admin" title="Admin Dashboard" subtitle="System Administrator" />
        <main className="p-6">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users and system administration.</p>
        </div>
      </div>
      
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
                    {users?.filter(u => u.isActive).length || 0}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <h3 className="font-medium text-gray-800">User Management</h3>
            </CardContent>
          </Card>

          <Card className="bg-white cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <ClipboardList className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <h3 className="font-medium text-gray-800">Attendance Logs</h3>
            </CardContent>
          </Card>

          <Card className="bg-white cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Settings className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <h3 className="font-medium text-gray-800">System Settings</h3>
            </CardContent>
          </Card>
        </div>

        {/* System Users */}
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
                      <td className="p-4 text-gray-700">{user.department || "Administration"}</td>
                      <td className="p-4">
                        <Badge className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
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
                <div className="text-center py-8 text-gray-500">
                  No users found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <AddUserModal
        open={addUserModalOpen}
        onOpenChange={setAddUserModalOpen}
      />
    </div>
  );
}

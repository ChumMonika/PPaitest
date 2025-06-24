import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, UserX, Clock, TrendingUp, Check, X, Crown, CalendarCheck } from "lucide-react";

interface DashboardStats {
  presentToday: number;
  absentToday: number;
  pendingLeaves: number;
  attendanceRate: number;
  totalUsers: number;
}

interface LeaveRequestWithUser {
  id: number;
  userId: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

interface AttendanceWithUser {
  id: number;
  userId: string;
  date: string;
  status: string;
  timeIn?: string;
  timeOut?: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
}

export default function HeadDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard-stats"],
  });

  const { data: leaveRequests, isLoading: leaveRequestsLoading } = useQuery<LeaveRequestWithUser[]>({
    queryKey: ["/api/leave-requests"],
  });

  const { data: todayAttendance, isLoading: attendanceLoading } = useQuery<AttendanceWithUser[]>({
    queryKey: ["/api/attendance-all"],
  });

  const respondToLeaveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("POST", `/api/leave-requests/${id}/respond`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Leave request updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update leave request",
        variant: "destructive",
      });
    },
  });

  const handleLeaveResponse = (id: number, status: string) => {
    respondToLeaveMutation.mutate({ id, status });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "teacher": return "bg-green-100 text-green-800";
      case "staff": return "bg-blue-100 text-blue-800";
      case "admin": return "bg-purple-100 text-purple-800";
      case "mazer": return "bg-orange-100 text-orange-800";
      case "assistant": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-800";
      case "absent": return "bg-red-100 text-red-800";
      case "on_leave": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  if (statsLoading || leaveRequestsLoading || attendanceLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader role="head" title="Head Dashboard" subtitle="Department Head" />
        <main className="p-6">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader role="head" title="Head Dashboard" subtitle="Department Head" />
      
      <main className="p-6 space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <Users className="text-green-600 w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Present Today</p>
                  <p className="text-2xl font-bold text-gray-800">{stats?.presentToday || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-red-100 p-3 rounded-full">
                  <UserX className="text-red-600 w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Absent Today</p>
                  <p className="text-2xl font-bold text-gray-800">{stats?.absentToday || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-orange-100 p-3 rounded-full">
                  <Clock className="text-orange-600 w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pending Leaves</p>
                  <p className="text-2xl font-bold text-gray-800">{stats?.pendingLeaves || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <TrendingUp className="text-blue-600 w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-gray-800">{stats?.attendanceRate || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leave Requests Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Crown className="mr-3 text-primary w-6 h-6" />
              Pending Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700">Employee</th>
                    <th className="text-left p-4 font-medium text-gray-700">Role</th>
                    <th className="text-left p-4 font-medium text-gray-700">Leave Type</th>
                    <th className="text-left p-4 font-medium text-gray-700">Dates</th>
                    <th className="text-left p-4 font-medium text-gray-700">Reason</th>
                    <th className="text-left p-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests && leaveRequests.length > 0 ? (
                    leaveRequests.map((request) => (
                      <tr key={request.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="font-medium text-primary text-sm">
                                {getInitials(request.user.name)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{request.user.name}</p>
                              <p className="text-sm text-gray-500">{request.user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={`${getRoleBadgeColor(request.user.role)} capitalize`}>
                            {request.user.role}
                          </Badge>
                        </td>
                        <td className="p-4 text-gray-700 capitalize">{request.leaveType}</td>
                        <td className="p-4 text-gray-700">
                          {new Date(request.fromDate).toLocaleDateString()} - {new Date(request.toDate).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-gray-700">{request.reason}</td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleLeaveResponse(request.id, "approved")}
                              disabled={respondToLeaveMutation.isPending}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleLeaveResponse(request.id, "rejected")}
                              disabled={respondToLeaveMutation.isPending}
                              size="sm"
                              variant="destructive"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">
                        No pending leave requests
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Today's Attendance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarCheck className="mr-3 text-primary w-6 h-6" />
              Today's Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Teachers */}
              <div>
                <h3 className="font-medium text-gray-800 mb-4 flex items-center">
                  <Crown className="mr-2 text-green-600 w-5 h-5" />
                  Teachers
                </h3>
                <div className="space-y-3">
                  {todayAttendance?.filter(att => att.user.role === "teacher").map((record) => (
                    <div key={record.id} className={`flex items-center justify-between p-3 rounded-lg ${
                      record.status === "present" ? "bg-green-50" : "bg-red-50"
                    }`}>
                      <div>
                        <p className="font-medium text-gray-800">{record.user.name}</p>
                        <p className="text-sm text-gray-600">ID: {record.user.id}</p>
                      </div>
                      <Badge className={`${getStatusBadgeColor(record.status)} capitalize`}>
                        {record.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Staff */}
              <div>
                <h3 className="font-medium text-gray-800 mb-4 flex items-center">
                  <Users className="mr-2 text-blue-600 w-5 h-5" />
                  Staff
                </h3>
                <div className="space-y-3">
                  {todayAttendance?.filter(att => att.user.role === "staff").map((record) => (
                    <div key={record.id} className={`flex items-center justify-between p-3 rounded-lg ${
                      record.status === "present" ? "bg-green-50" : "bg-red-50"
                    }`}>
                      <div>
                        <p className="font-medium text-gray-800">{record.user.name}</p>
                        <p className="text-sm text-gray-600">ID: {record.user.id}</p>
                      </div>
                      <Badge className={`${getStatusBadgeColor(record.status)} capitalize`}>
                        {record.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

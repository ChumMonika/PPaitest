import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, CheckCircle, Clock, Umbrella, User, FileText, UserCheck } from "lucide-react";

interface LeaveRequest {
  id: number;
  leaveType: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  createdAt: string;
}

interface AttendanceRecord {
  id: number;
  date: string;
  status: string;
  timeIn?: string;
  timeOut?: string;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [leaveForm, setLeaveForm] = useState({
    leaveType: "sick",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const { data: leaveRequests, isLoading: leaveRequestsLoading } = useQuery<LeaveRequest[]>({
    queryKey: ["/api/leave-requests"],
  });

  const { data: attendanceHistory, isLoading: attendanceLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/attendance", user?.id],
    enabled: !!user?.id,
  });

  const submitLeaveRequestMutation = useMutation({
    mutationFn: async (leaveData: any) => {
      const response = await apiRequest("POST", "/api/leave-requests", leaveData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Leave request submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leave-requests"] });
      setLeaveForm({
        leaveType: "sick",
        fromDate: "",
        toDate: "",
        reason: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit leave request",
        variant: "destructive",
      });
    },
  });

  const handleSubmitLeaveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.fromDate || !leaveForm.toDate || !leaveForm.reason.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    submitLeaveRequestMutation.mutate(leaveForm);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-800";
      case "absent": return "bg-red-100 text-red-800";
      case "on_leave": return "bg-orange-100 text-orange-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "pending": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDayName = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { weekday: "long" });
  };

  const calculateAttendanceStats = () => {
    if (!attendanceHistory) return { thisMonth: "0/0", thisYear: "0/0", leaveBalance: "12" };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const thisMonthAttendance = attendanceHistory.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });

    const thisYearAttendance = attendanceHistory.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getFullYear() === currentYear;
    });

    const thisMonthPresent = thisMonthAttendance.filter(record => record.status === "present").length;
    const thisYearPresent = thisYearAttendance.filter(record => record.status === "present").length;

    return {
      thisMonth: `${thisMonthPresent}/${thisMonthAttendance.length}`,
      thisYear: `${thisYearPresent}/${thisYearAttendance.length}`,
      leaveBalance: "12", // This would be calculated based on used leave days
    };
  };

  const stats = calculateAttendanceStats();

  if (leaveRequestsLoading || attendanceLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader role={user?.role || "teacher"} title="My Dashboard" subtitle={`${user?.name} - ${user?.department}`} />
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
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === "staff" ? "Staff Dashboard" : "Teacher Dashboard"}
          </h1>
          <p className="text-gray-600">
            Welcome back, {user?.name}! Here's your attendance overview.
          </p>
        </div>
      </div>
      
      <main className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.thisMonth} Days</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Calendar className="text-blue-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Present Days</p>
                  <p className="text-2xl font-bold text-green-600">
                    {attendanceHistory?.filter(a => a.status === "present").length || 0}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle className="text-green-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Late Days</p>
                  <p className="text-2xl font-bold text-orange-600">1</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Clock className="text-orange-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Leaves</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {leaveRequests?.filter(r => r.status === "pending").length || 0}
                  </p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Umbrella className="text-orange-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <UserCheck className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <h3 className="font-medium text-gray-800">My Attendance</h3>
            </CardContent>
          </Card>

          <Card className="bg-white cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <h3 className="font-medium text-gray-800">Request Leave</h3>
            </CardContent>
          </Card>

          <Card className="bg-white cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <User className="w-8 h-8 text-gray-600 mx-auto mb-3" />
              <h3 className="font-medium text-gray-800">Profile</h3>
            </CardContent>
          </Card>
        </div>

        {/* Attendance History */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>My Attendance History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700">Date</th>
                    <th className="text-left p-4 font-medium text-gray-700">Day</th>
                    <th className="text-left p-4 font-medium text-gray-700">Status</th>
                    <th className="text-left p-4 font-medium text-gray-700">Check In</th>
                    <th className="text-left p-4 font-medium text-gray-700">Check Out</th>
                    <th className="text-left p-4 font-medium text-gray-700">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory && attendanceHistory.length > 0 ? (
                    attendanceHistory.slice(0, 10).map((record) => (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 text-gray-800">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-gray-600">
                          {getDayName(record.date)}
                        </td>
                        <td className="p-4">
                          <Badge 
                            className={`${
                              record.status === "present" 
                                ? "bg-green-100 text-green-800" 
                                : record.status === "absent"
                                ? "bg-red-100 text-red-800"
                                : "bg-orange-100 text-orange-800"
                            } capitalize`}
                          >
                            {record.status === "present" ? "Present" : 
                             record.status === "absent" ? "Absent" : "Late"}
                          </Badge>
                        </td>
                        <td className="p-4 text-gray-700">{record.timeIn || "-"}</td>
                        <td className="p-4 text-gray-700">{record.timeOut || "-"}</td>
                        <td className="p-4 text-gray-700">
                          {record.timeIn && record.timeOut ? "7:45" : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        No attendance records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="text-green-600 w-8 h-8 mr-4" />
                <div>
                  <p className="text-sm text-green-600">Present Days</p>
                  <p className="text-2xl font-bold text-green-600">
                    {attendanceHistory?.filter(a => a.status === "present").length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="text-orange-600 w-8 h-8 mr-4" />
                <div>
                  <p className="text-sm text-orange-600">Late Days</p>
                  <p className="text-2xl font-bold text-orange-600">1</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserCheck className="text-red-600 w-8 h-8 mr-4" />
                <div>
                  <p className="text-sm text-red-600">Absent Days</p>
                  <p className="text-2xl font-bold text-red-600">
                    {attendanceHistory?.filter(a => a.status === "absent").length || 0}
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

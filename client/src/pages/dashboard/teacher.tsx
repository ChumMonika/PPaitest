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
import { CalendarPlus, BarChart3, History, ClipboardList } from "lucide-react";

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
      <DashboardHeader 
        role={user?.role || "teacher"} 
        title="My Dashboard" 
        subtitle={`${user?.name} (${user?.id}) - ${user?.department}`} 
      />
      
      <main className="p-6 space-y-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Leave Request */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarPlus className="mr-3 text-indigo-600 w-5 h-5" />
                Submit Leave Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitLeaveRequest} className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</Label>
                  <Select 
                    value={leaveForm.leaveType} 
                    onValueChange={(value) => setLeaveForm(prev => ({ ...prev, leaveType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="annual">Annual Leave</SelectItem>
                      <SelectItem value="personal">Personal Leave</SelectItem>
                      <SelectItem value="emergency">Emergency Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">From Date</Label>
                    <Input 
                      type="date" 
                      value={leaveForm.fromDate}
                      onChange={(e) => setLeaveForm(prev => ({ ...prev, fromDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700 mb-2">To Date</Label>
                    <Input 
                      type="date" 
                      value={leaveForm.toDate}
                      onChange={(e) => setLeaveForm(prev => ({ ...prev, toDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Reason</Label>
                  <Textarea 
                    rows={3}
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Please provide reason for leave..."
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={submitLeaveRequestMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {submitLeaveRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Attendance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-3 text-indigo-600 w-5 h-5" />
                Attendance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700">This Month</span>
                  <span className="font-semibold text-green-600">{stats.thisMonth} days</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">This Year</span>
                  <span className="font-semibold text-blue-600">{stats.thisYear} days</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-gray-700">Leave Balance</span>
                  <span className="font-semibold text-orange-600">{stats.leaveBalance} days</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="mr-3 text-indigo-600 w-6 h-6" />
              Recent Attendance History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-700">Date</th>
                    <th className="text-left p-4 font-medium text-gray-700">Day</th>
                    <th className="text-left p-4 font-medium text-gray-700">Status</th>
                    <th className="text-left p-4 font-medium text-gray-700">Time In</th>
                    <th className="text-left p-4 font-medium text-gray-700">Time Out</th>
                    <th className="text-left p-4 font-medium text-gray-700">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory && attendanceHistory.length > 0 ? (
                    attendanceHistory.slice(0, 10).map((record) => (
                      <tr key={record.id} className="border-b">
                        <td className="p-4 text-gray-800">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-gray-600">
                          {getDayName(record.date)}
                        </td>
                        <td className="p-4">
                          <Badge className={`${getStatusBadgeColor(record.status)} capitalize`}>
                            {record.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-4 text-gray-700">{record.timeIn || "-"}</td>
                        <td className="p-4 text-gray-700">{record.timeOut || "-"}</td>
                        <td className="p-4 text-gray-700">
                          {record.timeIn && record.timeOut ? "8h 15m" : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-gray-500">
                        No attendance records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Leave Request Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardList className="mr-3 text-indigo-600 w-6 h-6" />
              My Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaveRequests && leaveRequests.length > 0 ? (
                leaveRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-800 capitalize">{request.leaveType} Leave</h3>
                      <p className="text-gray-600 text-sm">
                        {new Date(request.fromDate).toLocaleDateString()} - {new Date(request.toDate).toLocaleDateString()}
                      </p>
                      <p className="text-gray-500 text-sm">{request.reason}</p>
                    </div>
                    <Badge className={`${getStatusBadgeColor(request.status)} capitalize`}>
                      {request.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No leave requests found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

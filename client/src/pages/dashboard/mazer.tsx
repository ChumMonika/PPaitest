import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CalendarCheck, Check, X, UserCheck, UserX, Calendar, Presentation } from "lucide-react";

interface ScheduleWithDetails {
  id: number;
  userId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
  attendance: {
    id: number;
    status: string;
    timeIn?: string;
    markedAt: string;
  } | null;
}

export default function MazerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teacherSchedules, isLoading } = useQuery<ScheduleWithDetails[]>({
    queryKey: ["/api/schedules/Monday"],
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiRequest("POST", "/api/mark-attendance", {
        userId,
        date: today,
        status,
        timeIn: status === "present" ? new Date().toTimeString().slice(0, 5) : null,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Attendance marked successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules/Monday"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance",
        variant: "destructive",
      });
    },
  });

  const handleMarkAttendance = (userId: string, status: string) => {
    markAttendanceMutation.mutate({ userId, status });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const getStatusDisplay = (attendance: any) => {
    if (!attendance) return null;
    
    const statusColors = {
      present: "bg-green-100 text-green-800",
      absent: "bg-red-100 text-red-800",
      on_leave: "bg-orange-100 text-orange-800",
    };

    return (
      <div className="flex items-center space-x-3">
        <Badge className={`${statusColors[attendance.status as keyof typeof statusColors]} flex items-center`}>
          {attendance.status === "present" && <Check className="w-3 h-3 mr-1" />}
          {attendance.status === "absent" && <X className="w-3 h-3 mr-1" />}
          {attendance.status === "on_leave" && <Calendar className="w-3 h-3 mr-1" />}
          {attendance.status === "present" ? "Present" : 
           attendance.status === "absent" ? "Absent" : "On Leave"}
        </Badge>
        {attendance.timeIn && (
          <span className="text-sm text-gray-500">
            Marked at {attendance.timeIn}
          </span>
        )}
      </div>
    );
  };

  const teachersOnly = teacherSchedules?.filter(schedule => schedule.user.role === "teacher") || [];
  const presentCount = teachersOnly.filter(schedule => schedule.attendance?.status === "present").length;
  const absentCount = teachersOnly.filter(schedule => schedule.attendance?.status === "absent").length;
  const onLeaveCount = teachersOnly.filter(schedule => schedule.attendance?.status === "on_leave").length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader role="mazer" title="Mazer Dashboard" subtitle="Teacher Supervisor" />
        <main className="p-6">
          <div className="text-center">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader role="mazer" title="Mazer Dashboard" subtitle="Teacher Supervisor" />
      
      <main className="p-6">
        {/* Teacher Schedule & Attendance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarCheck className="mr-3 text-green-600 w-6 h-6" />
              📅 Today - Teacher Schedule & Attendance
              <span className="ml-4 text-sm text-gray-500 font-normal">
                ({new Date().toLocaleDateString()})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teachersOnly.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-green-600 text-sm">
                        {getInitials(schedule.user.name)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {schedule.user.name} ({schedule.user.id})
                      </h3>
                      <p className="text-gray-600">
                        {schedule.subject} – {schedule.startTime}-{schedule.endTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {schedule.attendance ? (
                      getStatusDisplay(schedule.attendance)
                    ) : (
                      <>
                        <Button
                          onClick={() => handleMarkAttendance(schedule.userId, "present")}
                          disabled={markAttendanceMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Mark Present
                        </Button>
                        <Button
                          onClick={() => handleMarkAttendance(schedule.userId, "absent")}
                          disabled={markAttendanceMutation.isPending}
                          variant="destructive"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Mark Absent
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              {teachersOnly.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No teachers scheduled for today
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <UserCheck className="text-green-600 w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Teachers Present</p>
                  <p className="text-2xl font-bold text-gray-800">{presentCount}</p>
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
                  <p className="text-sm text-gray-600">Teachers Absent</p>
                  <p className="text-2xl font-bold text-gray-800">{absentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-orange-100 p-3 rounded-full">
                  <Calendar className="text-orange-600 w-6 h-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">On Leave</p>
                  <p className="text-2xl font-bold text-gray-800">{onLeaveCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

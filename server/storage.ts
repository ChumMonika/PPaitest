import { 
  users, schedules, attendance, leaveRequests,
  type User, type InsertUser, 
  type Attendance, type InsertAttendance,
  type LeaveRequest, type InsertLeaveRequest,
  type Schedule, type InsertSchedule
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByCredentials(id: string, password: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Attendance operations
  getAttendance(userId: string, date: string): Promise<Attendance | undefined>;
  getAttendanceHistory(userId: string, limit?: number): Promise<Attendance[]>;
  getAllAttendanceForDate(date: string): Promise<Attendance[]>;
  markAttendance(attendance: InsertAttendance): Promise<Attendance>;
  
  // Leave request operations
  createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest>;
  getLeaveRequestsByUser(userId: string): Promise<LeaveRequest[]>;
  getPendingLeaveRequests(): Promise<LeaveRequest[]>;
  updateLeaveRequestStatus(id: number, status: string, approvedBy: string): Promise<LeaveRequest | undefined>;
  
  // Schedule operations
  getUserSchedule(userId: string): Promise<Schedule[]>;
  getAllSchedulesForDay(dayOfWeek: string): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private attendanceRecords: Map<string, Attendance>;
  private leaveRequestsList: Map<number, LeaveRequest>;
  private schedulesList: Map<number, Schedule>;
  private currentLeaveId: number;
  private currentScheduleId: number;
  private currentAttendanceId: number;

  constructor() {
    this.users = new Map();
    this.attendanceRecords = new Map();
    this.leaveRequestsList = new Map();
    this.schedulesList = new Map();
    this.currentLeaveId = 1;
    this.currentScheduleId = 1;
    this.currentAttendanceId = 1;
    
    this.initializeData();
  }

  private initializeData() {
    // Create initial users
    const initialUsers: User[] = [
      { id: "H001", name: "Dr. Smith", email: "dr.smith@university.edu", password: "password123", role: "head", department: "Administration", isActive: true },
      { id: "A001", name: "Ms. Anderson", email: "ms.anderson@university.edu", password: "password123", role: "admin", department: "Administration", isActive: true },
      { id: "M001", name: "Mr. Wilson", email: "mr.wilson@university.edu", password: "password123", role: "mazer", department: "Academic Affairs", isActive: true },
      { id: "AS001", name: "Ms. Thompson", email: "ms.thompson@university.edu", password: "password123", role: "assistant", department: "Human Resources", isActive: true },
      { id: "T001", name: "Mr. Chan", email: "mr.chan@university.edu", password: "password123", role: "teacher", department: "Mathematics", isActive: true },
      { id: "T002", name: "Ms. Lina", email: "ms.lina@university.edu", password: "password123", role: "teacher", department: "English", isActive: true },
      { id: "T003", name: "Ms. Sarah Johnson", email: "ms.johnson@university.edu", password: "password123", role: "teacher", department: "Science", isActive: true },
      { id: "T004", name: "Dr. Michael", email: "dr.michael@university.edu", password: "password123", role: "teacher", department: "Physics", isActive: true },
      { id: "S001", name: "Ms. Vanna", email: "ms.vanna@university.edu", password: "password123", role: "staff", department: "IT Services", isActive: true },
      { id: "S002", name: "Mr. Dara", email: "mr.dara@university.edu", password: "password123", role: "staff", department: "IT Services", isActive: true },
      { id: "S003", name: "Ms. Linda Kim", email: "ms.kim@university.edu", password: "password123", role: "staff", department: "Administration", isActive: true },
      { id: "S004", name: "Mr. Robert Kim", email: "mr.rkim@university.edu", password: "password123", role: "staff", department: "Maintenance", isActive: true },
      { id: "S005", name: "Ms. Anna Park", email: "ms.park@university.edu", password: "password123", role: "staff", department: "Library", isActive: true },
    ];

    initialUsers.forEach(user => this.users.set(user.id, user));

    // Create schedules
    const initialSchedules: Schedule[] = [
      // Teachers
      { id: 1, userId: "T001", dayOfWeek: "monday", startTime: "08:00", endTime: "10:00", subject: "Math", workType: null },
      { id: 2, userId: "T002", dayOfWeek: "monday", startTime: "10:00", endTime: "12:00", subject: "English", workType: null },
      { id: 3, userId: "T003", dayOfWeek: "monday", startTime: "13:00", endTime: "15:00", subject: "Science", workType: null },
      { id: 4, userId: "T004", dayOfWeek: "monday", startTime: "15:00", endTime: "17:00", subject: "Physics", workType: null },
      // Staff
      { id: 5, userId: "S001", dayOfWeek: "monday", startTime: "08:00", endTime: "17:00", subject: null, workType: "IT Full-Time" },
      { id: 6, userId: "S002", dayOfWeek: "monday", startTime: "08:00", endTime: "12:00", subject: null, workType: "IT Part-Time" },
      { id: 7, userId: "S003", dayOfWeek: "monday", startTime: "09:00", endTime: "16:00", subject: null, workType: "Administration" },
      { id: 8, userId: "S004", dayOfWeek: "monday", startTime: "07:00", endTime: "15:00", subject: null, workType: "Maintenance" },
      { id: 9, userId: "S005", dayOfWeek: "monday", startTime: "10:00", endTime: "18:00", subject: null, workType: "Library" },
    ];

    initialSchedules.forEach(schedule => {
      this.schedulesList.set(schedule.id, schedule);
      this.currentScheduleId = Math.max(this.currentScheduleId, schedule.id + 1);
    });

    // Create some initial attendance records for today
    const today = new Date().toISOString().split('T')[0];
    const initialAttendance: Attendance[] = [
      { id: 1, userId: "T001", date: today, status: "present", timeIn: "07:45", timeOut: null, markedBy: "M001", markedAt: new Date() },
      { id: 2, userId: "S001", date: today, status: "present", timeIn: "07:55", timeOut: null, markedBy: "AS001", markedAt: new Date() },
      { id: 3, userId: "S003", date: today, status: "present", timeIn: "08:50", timeOut: null, markedBy: "AS001", markedAt: new Date() },
    ];

    initialAttendance.forEach(att => {
      this.attendanceRecords.set(`${att.userId}-${att.date}`, att);
      this.currentAttendanceId = Math.max(this.currentAttendanceId, att.id + 1);
    });

    // Create some initial leave requests
    const initialLeaveRequests: LeaveRequest[] = [
      { id: 1, userId: "T003", leaveType: "sick", fromDate: "2024-11-26", toDate: "2024-11-27", reason: "Medical appointment", status: "pending", approvedBy: null, createdAt: new Date(), respondedAt: null },
      { id: 2, userId: "S004", leaveType: "annual", fromDate: "2024-12-01", toDate: "2024-12-05", reason: "Family vacation", status: "pending", approvedBy: null, createdAt: new Date(), respondedAt: null },
    ];

    initialLeaveRequests.forEach(req => {
      this.leaveRequestsList.set(req.id, req);
      this.currentLeaveId = Math.max(this.currentLeaveId, req.id + 1);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByCredentials(id: string, password: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user && user.password === password) {
      return user;
    }
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = { ...user, isActive: true };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (user) {
      const updatedUser = { ...user, ...updates };
      this.users.set(id, updatedUser);
      return updatedUser;
    }
    return undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAttendance(userId: string, date: string): Promise<Attendance | undefined> {
    return this.attendanceRecords.get(`${userId}-${date}`);
  }

  async getAttendanceHistory(userId: string, limit: number = 10): Promise<Attendance[]> {
    const userAttendance = Array.from(this.attendanceRecords.values())
      .filter(att => att.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
    return userAttendance;
  }

  async getAllAttendanceForDate(date: string): Promise<Attendance[]> {
    return Array.from(this.attendanceRecords.values())
      .filter(att => att.date === date);
  }

  async markAttendance(attendance: InsertAttendance): Promise<Attendance> {
    const newAttendance: Attendance = {
      id: this.currentAttendanceId++,
      ...attendance,
      markedAt: new Date(),
    };
    this.attendanceRecords.set(`${attendance.userId}-${attendance.date}`, newAttendance);
    return newAttendance;
  }

  async createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest> {
    const newRequest: LeaveRequest = {
      id: this.currentLeaveId++,
      ...request,
      status: "pending",
      approvedBy: null,
      createdAt: new Date(),
      respondedAt: null,
    };
    this.leaveRequestsList.set(newRequest.id, newRequest);
    return newRequest;
  }

  async getLeaveRequestsByUser(userId: string): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequestsList.values())
      .filter(req => req.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequestsList.values())
      .filter(req => req.status === "pending")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async updateLeaveRequestStatus(id: number, status: string, approvedBy: string): Promise<LeaveRequest | undefined> {
    const request = this.leaveRequestsList.get(id);
    if (request) {
      const updatedRequest = {
        ...request,
        status,
        approvedBy,
        respondedAt: new Date(),
      };
      this.leaveRequestsList.set(id, updatedRequest);
      return updatedRequest;
    }
    return undefined;
  }

  async getUserSchedule(userId: string): Promise<Schedule[]> {
    return Array.from(this.schedulesList.values())
      .filter(schedule => schedule.userId === userId);
  }

  async getAllSchedulesForDay(dayOfWeek: string): Promise<Schedule[]> {
    return Array.from(this.schedulesList.values())
      .filter(schedule => schedule.dayOfWeek === dayOfWeek);
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const newSchedule: Schedule = {
      id: this.currentScheduleId++,
      ...schedule,
    };
    this.schedulesList.set(newSchedule.id, newSchedule);
    return newSchedule;
  }
}

export const storage = new MemStorage();

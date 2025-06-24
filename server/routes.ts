import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { insertUserSchema, insertLeaveRequestSchema, insertAttendanceSchema } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    userRole?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'university-attendance-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  const requireRole = (roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.session.userRole || !roles.includes(req.session.userRole)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };

  // Authentication routes
  app.post("/api/login", async (req, res) => {
    try {
      const { id, password } = req.body;
      
      if (!id || !password) {
        return res.status(400).json({ message: "ID and password are required" });
      }

      const user = await storage.getUserByCredentials(id, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;

      res.json({ 
        id: user.id, 
        name: user.name, 
        role: user.role,
        department: user.department 
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User management routes (Admin only)
  app.get("/api/users", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.put("/api/users/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const user = await storage.updateUser(id, updates);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Attendance routes
  app.get("/api/attendance/:userId", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Users can only view their own attendance unless they're head/admin
      if (req.session.userId !== userId && !["head", "admin"].includes(req.session.userRole!)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const attendance = await storage.getAttendanceHistory(userId, limit);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/attendance-all", requireAuth, requireRole(["head", "admin"]), async (req, res) => {
    try {
      const date = req.query.date as string || new Date().toISOString().split('T')[0];
      const attendance = await storage.getAllAttendanceForDate(date);
      
      // Get user details for each attendance record
      const attendanceWithUsers = await Promise.all(
        attendance.map(async (att) => {
          const user = await storage.getUser(att.userId);
          return {
            ...att,
            user: user ? { id: user.id, name: user.name, role: user.role } : null
          };
        })
      );
      
      res.json(attendanceWithUsers);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/mark-attendance", requireAuth, requireRole(["mazer", "assistant"]), async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse({
        ...req.body,
        markedBy: req.session.userId,
      });
      
      const attendance = await storage.markAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      res.status(400).json({ message: "Invalid attendance data" });
    }
  });

  // Schedule routes
  app.get("/api/schedules/:dayOfWeek", requireAuth, async (req, res) => {
    try {
      const { dayOfWeek } = req.params;
      const schedules = await storage.getAllSchedulesForDay(dayOfWeek.toLowerCase());
      
      // Get user details and attendance for each schedule
      const today = new Date().toISOString().split('T')[0];
      const schedulesWithDetails = await Promise.all(
        schedules.map(async (schedule) => {
          const user = await storage.getUser(schedule.userId);
          const attendance = await storage.getAttendance(schedule.userId, today);
          
          return {
            ...schedule,
            user: user ? { id: user.id, name: user.name, role: user.role } : null,
            attendance: attendance || null
          };
        })
      );
      
      res.json(schedulesWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Leave request routes
  app.post("/api/leave-requests", requireAuth, async (req, res) => {
    try {
      const leaveData = insertLeaveRequestSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      
      const leaveRequest = await storage.createLeaveRequest(leaveData);
      res.status(201).json(leaveRequest);
    } catch (error) {
      res.status(400).json({ message: "Invalid leave request data" });
    }
  });

  app.get("/api/leave-requests", requireAuth, async (req, res) => {
    try {
      if (req.session.userRole === "head" || req.session.userRole === "admin") {
        // Head and admin can see all pending requests
        const requests = await storage.getPendingLeaveRequests();
        
        // Get user details for each request
        const requestsWithUsers = await Promise.all(
          requests.map(async (request) => {
            const user = await storage.getUser(request.userId);
            return {
              ...request,
              user: user ? { id: user.id, name: user.name, role: user.role } : null
            };
          })
        );
        
        res.json(requestsWithUsers);
      } else {
        // Other users can only see their own requests
        const requests = await storage.getLeaveRequestsByUser(req.session.userId!);
        res.json(requests);
      }
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/leave-requests/:id/respond", requireAuth, requireRole(["head"]), async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body; // "approved" or "rejected"
      
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedRequest = await storage.updateLeaveRequestStatus(
        parseInt(id), 
        status, 
        req.session.userId!
      );
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Leave request not found" });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard stats routes
  app.get("/api/dashboard-stats", requireAuth, requireRole(["head", "admin"]), async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = await storage.getAllAttendanceForDate(today);
      
      const presentToday = todayAttendance.filter(att => att.status === "present").length;
      const absentToday = todayAttendance.filter(att => att.status === "absent").length;
      const pendingLeaves = await storage.getPendingLeaveRequests();
      const totalUsers = await storage.getAllUsers();
      const totalActiveUsers = totalUsers.filter(user => user.isActive).length;
      
      const attendanceRate = totalActiveUsers > 0 
        ? Math.round((presentToday / totalActiveUsers) * 100) 
        : 0;
      
      res.json({
        presentToday,
        absentToday,
        pendingLeaves: pendingLeaves.length,
        attendanceRate,
        totalUsers: totalActiveUsers
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // e.g., "H001", "T001", "S001"
  name: text("name").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull(), // "head", "admin", "mazer", "assistant", "teacher", "staff"
  department: text("department"),
  isActive: boolean("is_active").default(true),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  status: text("status").notNull(), // "present", "absent", "on_leave"
  timeIn: text("time_in"),
  timeOut: text("time_out"),
  markedBy: text("marked_by"), // who marked the attendance
  markedAt: timestamp("marked_at").defaultNow(),
});

export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  leaveType: text("leave_type").notNull(), // "sick", "annual", "personal", "emergency"
  fromDate: text("from_date").notNull(),
  toDate: text("to_date").notNull(),
  reason: text("reason").notNull(),
  status: text("status").default("pending"), // "pending", "approved", "rejected"
  approvedBy: text("approved_by"),
  createdAt: timestamp("created_at").defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  dayOfWeek: text("day_of_week").notNull(), // "monday", "tuesday", etc.
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  subject: text("subject"), // for teachers
  workType: text("work_type"), // for staff - "full_time", "part_time"
});

export const insertUserSchema = createInsertSchema(users).omit({
  isActive: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  markedAt: true,
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({
  id: true,
  status: true,
  approvedBy: true,
  createdAt: true,
  respondedAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

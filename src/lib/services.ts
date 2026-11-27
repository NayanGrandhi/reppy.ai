// Sample (mock) data accessors, used by tests and the signed-out sample
// dashboard. Pages read data through useData() in lib/dashboard/context.tsx,
// which serves either this sample data or the owner's real business.
import * as mock from "./mock/data";
import { freeSlots as freeSlotsFor } from "./dashboard/slots";
import type { Appointment, Service } from "./types";

export const DEMO_TODAY = mock.DEMO_TODAY;

export const getBusiness = () => mock.business;
export const getStaff = () => mock.staff;
export const getServices = () => mock.services;
export const getCustomers = () => mock.customers;
export const getConversations = () => mock.conversations;
export const getAppointments = () => mock.appointments;
export const getKnowledgeGaps = () => mock.knowledgeGaps;
export const getChangeLog = () => mock.changeLog;
export const getFaqs = () => mock.faqs;
export const getReceptionistConfig = () => mock.receptionist;
export const getDailyVolume = () => mock.dailyVolume;
export const getPeakHours = () => mock.peakHours;
export const getTopQuestions = () => mock.topQuestions;

export const customerById = (id: string) => mock.customers.find((c) => c.id === id);
export const serviceById = (id: string) => mock.services.find((s) => s.id === id);
export const staffById = (id: string) => mock.staff.find((s) => s.id === id);

/** Free start times on the sample data (see lib/dashboard/slots.ts). */
export const freeSlots = (date: string, service: Service, staffId: string, existing: Appointment[], stepMin = 30) =>
  freeSlotsFor({ business: mock.business, staff: mock.staff, services: mock.services }, date, service, staffId, existing, stepMin);

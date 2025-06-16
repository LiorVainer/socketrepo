import { z } from 'zod';

export const SendToDeviceSchema = z.object({
  deviceId: z.string().min(1),
  command: z.string().min(1),
});


export const RoleQuerySchema = z.object({
  role: z.string(),
});

export const DeviceQuerySchema = z.object({
  deviceId: z.string(),
});


export type SendToDeviceInput = z.infer<typeof SendToDeviceSchema>;

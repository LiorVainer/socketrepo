import { TypedSocket } from '../types';

export class SocketRegistry<
  CTS extends Record<string, any>,
  STC extends Record<string, any>,
  D extends Record<string, any>
> {
  private devices = new Map<string, TypedSocket<CTS, STC, D>>();
  private roles = new Map<string, TypedSocket<CTS, STC, D>>();

  public registerDevice(deviceId: string, socket: TypedSocket<CTS, STC, D>) {
    this.devices.set(deviceId, socket);
  }

  public getDevice(deviceId: string): TypedSocket<CTS, STC, D> | undefined {
    return this.devices.get(deviceId);
  }

  public removeDevice(deviceId: string) {
    this.devices.delete(deviceId);
  }

  public registerRole(role: string, socket: TypedSocket<CTS, STC, D>) {
    this.roles.set(role, socket);
  }

  public getRole(role: string): TypedSocket<CTS, STC, D> | undefined {
    return this.roles.get(role);
  }

  public removeRole(role: string) {
    this.roles.delete(role);
  }
}

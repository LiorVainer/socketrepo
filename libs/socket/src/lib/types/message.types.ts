export interface BaseMessage<T = any> {
  messageId: string;
  payload: T;
}

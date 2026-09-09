export * from './tender';
export * from './requirement';
export * from './bidder';
export * from './bid';
export * from './document';
export * from './evidence';
export * from './verification';
export * from './compliance';
export * from './risk';
export * from './recommendation';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  request_id: string;
}

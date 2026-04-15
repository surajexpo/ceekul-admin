export interface AdminRegisterPayload {
  name: string;
  email: string;
  password: string;
  number: string;
}

export interface AdminRegisterResponse {
  status: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export interface AdminProfile {
  _id: string;
  name: string;
  email: string;
  number: string;
  role: 'admin' | 'superadmin';
  status: boolean;
}

export interface AdminLoginResponse {
  status: boolean;
  message: string;
  token: string;
  admin: AdminProfile;
}

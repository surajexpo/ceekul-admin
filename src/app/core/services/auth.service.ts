import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  AdminLoginPayload,
  AdminLoginResponse,
  AdminProfile,
  AdminRegisterPayload,
  AdminRegisterResponse
} from '../../models/auth.model';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'authRefreshToken';
const ADMIN_KEY = 'authAdmin';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/admin`;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // ── Register ──────────────────────────────────────────────
  register(payload: AdminRegisterPayload): Observable<AdminRegisterResponse> {
    return this.http.post<AdminRegisterResponse>(`${this.baseUrl}/register`, payload);
  }

  // ── Login ─────────────────────────────────────────────────
  login(payload: AdminLoginPayload): Observable<AdminLoginResponse> {
    return this.http.post<AdminLoginResponse>(`${this.baseUrl}/login`, payload).pipe(
      tap(res => {
        if (this.isBrowser) {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
          localStorage.setItem(ADMIN_KEY, JSON.stringify(res.admin));
        }
      })
    );
  }

  // ── Session helpers ───────────────────────────────────────
  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(ADMIN_KEY);
    }
  }

  isLoggedIn(): boolean {
    return this.isBrowser ? !!localStorage.getItem(TOKEN_KEY) : false;
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem(TOKEN_KEY) : null;
  }

  getAdmin(): AdminProfile | null {
    if (!this.isBrowser) return null;
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? (JSON.parse(raw) as AdminProfile) : null;
  }
}

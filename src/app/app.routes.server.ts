import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Auth routes — no session on server, render client-side
  { path: 'login',    renderMode: RenderMode.Client },
  { path: 'register', renderMode: RenderMode.Client },

  // Protected app routes — user-specific, render client-side
  { path: 'dashboard',             renderMode: RenderMode.Client },
  { path: 'users',                 renderMode: RenderMode.Client },
  { path: 'teachers',              renderMode: RenderMode.Client },
  { path: 'workshops',             renderMode: RenderMode.Client },
  { path: 'workshops/new',         renderMode: RenderMode.Client },
  { path: 'workshops/edit/:id',    renderMode: RenderMode.Client },
  { path: 'workshops/:id',         renderMode: RenderMode.Client },
  { path: 'programs',              renderMode: RenderMode.Client },
  { path: 'programs/new',         renderMode: RenderMode.Client },
  { path: 'programs/edit/:id',    renderMode: RenderMode.Client },
  { path: 'programs/:id',         renderMode: RenderMode.Client },
  { path: 'content',               renderMode: RenderMode.Client },

  // Fallback
  { path: '**', renderMode: RenderMode.Client }
];

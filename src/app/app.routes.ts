import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Auth routes — no sidebar/header layout
  {
    path: 'login',
    loadComponent: () => import('./modules/auth/login/login').then(m => m.Login)
  },
  {
    path: 'register',
    loadComponent: () => import('./modules/auth/register/register').then(m => m.Register)
  },

  // Main app layout — protected
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout').then(m => m.MainLayout),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./modules/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'users', loadComponent: () => import('./modules/users/users').then(m => m.Users) },
      { path: 'teachers', loadComponent: () => import('./modules/teachers/teachers').then(m => m.Teachers) },
      {
        path: 'workshops',
        children: [
          { path: '', loadComponent: () => import('./modules/workshops/workshops').then(m => m.Workshops) },
          { path: 'new', loadComponent: () => import('./modules/workshops/workshop-form/workshop-form').then(m => m.WorkshopForm) },
          { path: 'edit/:id', loadComponent: () => import('./modules/workshops/workshop-form/workshop-form').then(m => m.WorkshopForm) },
          { path: ':id', loadComponent: () => import('./modules/workshops/workshop-detail/workshop-detail').then(m => m.WorkshopDetail) }
        ]
      },
      {
        path: 'programs',
        children: [
          { path: '', loadComponent: () => import('./modules/programs/programs').then(m => m.Programs) },
          { path: 'new', loadComponent: () => import('./modules/programs/program-form/program-form').then(m => m.ProgramForm) },
          { path: 'edit/:id', loadComponent: () => import('./modules/programs/program-form/program-form').then(m => m.ProgramForm) },
          { path: ':id', loadComponent: () => import('./modules/programs/program-detail/program-detail').then(m => m.ProgramDetail) }
        ]
      },
      { path: 'content', loadComponent: () => import('./modules/content/content').then(m => m.Content) },
      {
        path: 'temp-workshops',
        loadComponent: () =>
          import('./modules/temp-workshops/temp-workshops').then(({ TempWorkshops }) => TempWorkshops)
      }

    ]
  },
  { path: '**', redirectTo: '' }
];

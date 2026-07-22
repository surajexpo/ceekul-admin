import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar {
  menuItems = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Users', icon: 'people', route: '/users' },
    { label: 'Temp Workshops', icon: 'event', route: '/temp-workshops' },
    { label: 'Teachers', icon: 'school', route: '/teachers' },
    { label: 'Programs', icon: 'school', route: '/programs' },
    { label: 'Workshops', icon: 'event', route: '/workshops' },
    { label: 'Content', icon: 'article', route: '/content' },
    { label: 'Research', icon: 'science', route: '/research' },
    { label: 'Analytics', icon: 'analytics', route: '/analytics' },
    { label: 'Notifications', icon: 'notifications', route: '/notifications' },
    { label: 'Systems', icon: 'list_alt', route: '/logs' },
    { label: 'Settings', icon: 'settings', route: '/settings' }
  ];
}

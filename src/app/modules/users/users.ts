import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.html',
  styleUrl: './users.scss'
})
export class Users {
  usersList = [
    { id: '1', name: 'Alice Cooper', email: 'alice@example.com', role: 'Student', status: 'Active', joined: '2025-10-12' },
    { id: '2', name: 'Dr. Robert Hale', email: 'robert.h@example.com', role: 'Teacher', status: 'Verified', joined: '2025-08-04' },
    { id: '3', name: 'Emily Chen', email: 'emily.c@example.com', role: 'Researcher', status: 'Active', joined: '2026-01-20' },
    { id: '4', name: 'Michael Smith', email: 'mike.smith@example.com', role: 'Student', status: 'Suspended', joined: '2025-11-05' },
    { id: '5', name: 'Sarah Jenkins', email: 's.jenkins@example.com', role: 'Moderator', status: 'Active', joined: '2024-05-15' },
    { id: '6', name: 'Tom Hardy', email: 'tom.h@example.com', role: 'Admin', status: 'Active', joined: '2023-12-01' }
  ];

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'Admin': return 'bg-gray-200 text-gray-700';
      case 'Moderator': return 'bg-gray-200 text-gray-700';
      case 'Teacher': return 'bg-black bg-opacity-20 text-black';
      case 'Researcher': return 'bg-gray-200 text-gray-500';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Active': return 'bg-gray-200 text-gray-700';
      case 'Verified': return 'bg-gray-200 text-gray-700';
      case 'Suspended': return 'bg-gray-200 text-gray-700';
      case 'Pending': return 'bg-gray-200 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}

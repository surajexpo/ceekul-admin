import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-teachers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teachers.html',
  styleUrl: './teachers.scss'
})
export class Teachers {
  pendingTeachers = [
    { id: '1', name: 'Dr. Emily Harrison', field: 'Space Education', applied: '2 days ago', status: 'Pending', docVerified: false, initial: 'E' },
    { id: '2', name: 'Prof. Alan Turing', field: 'Computable Vision', applied: '5 hours ago', status: 'Pending', docVerified: true, initial: 'A' },
    { id: '3', name: 'Jane Doe', field: 'General Science', applied: '1 week ago', status: 'Rejected', docVerified: false, initial: 'J' },
  ];
}

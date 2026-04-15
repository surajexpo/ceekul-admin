import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './content.html',
  styleUrl: './content.scss'
})
export class Content {
  contentList = [
    { id: '1', title: 'Introduction to SpaceX and Orbital Mechanics', category: 'Space Education', type: 'Video', status: 'Published', views: '12.5k' },
    { id: '2', title: 'Formulas and Algorithms for AI', category: 'Mathematics', type: 'PDF', status: 'Draft', views: '-' },
    { id: '3', title: 'History of Applied Computer Science', category: 'Computable Vision', type: 'Article', status: 'Published', views: '5k' },
    { id: '4', title: 'Advanced Rocketry Physics Engine', category: 'Science', type: 'Video', status: 'Archived', views: '8.2k' },
  ];

  getStatusClass(status: string): string {
    switch(status) {
      case 'Published': return 'bg-green-50 text-gray-700 border border-gray-400';
      case 'Draft': return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'Archived': return 'bg-orange-50 text-gray-500 border border-orange-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  }
}

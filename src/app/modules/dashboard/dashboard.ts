import { Component, AfterViewInit, ViewChild, ElementRef, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements AfterViewInit {
  @ViewChild('growthChart') growthChart!: ElementRef;
  
  metrics = [
    { title: 'Total Users', value: '12,450', percent: '+14%', trend: 'up', icon: 'groups', color: 'text-gray-800', bg: 'bg-gray-200' },
    { title: 'Verified Teachers', value: '342', percent: '+5%', trend: 'up', icon: 'school', color: 'text-black', bg: 'bg-black/20' },
    { title: 'Active Workshops', value: '89', percent: '-2%', trend: 'down', icon: 'event', color: 'text-gray-500', bg: 'bg-gray-200' },
    { title: 'Research Modules', value: '1,204', percent: '+22%', trend: 'up', icon: 'science', color: 'text-gray-700', bg: 'bg-gray-200' }
  ];

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId) && this.growthChart) {
      new Chart(this.growthChart.nativeElement, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          datasets: [{
            label: 'User Growth',
            data: [65, 80, 105, 115, 160, 205],
            borderColor: '#333333',
            tension: 0.4,
            fill: true,
            backgroundColor: 'rgba(51, 51, 51, 0.1)'
          }]
        },
        options: { 
          responsive: true, 
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: true, border: { display: false }, grid: { color: '#f3f4f6' } },
            x: { border: { display: false }, grid: { display: false } }
          }
        }
      });
    }
  }
}

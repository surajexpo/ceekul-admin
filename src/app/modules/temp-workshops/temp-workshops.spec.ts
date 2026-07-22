import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TempWorkshops } from './temp-workshops';

describe('TempWorkshops', () => {
  let component: TempWorkshops;
  let fixture: ComponentFixture<TempWorkshops>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TempWorkshops],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TempWorkshops);
    component = fixture.componentInstance;
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(request => request.url.endsWith('/api/v1/temp-workshops')).flush({
      status: true, message: 'ok', data: { items: [], pagination: { total: 0, page: 1, limit: 100, totalPages: 0 } }
    });
    http.expectOne(request => request.url.endsWith('/api/v1/temp-workshop-categories')).flush({
      status: true, message: 'ok', data: []
    });
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
